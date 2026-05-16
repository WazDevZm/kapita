from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count
from datetime import datetime, timedelta

from products.models import Product
from sales.models import Sale
from expenses.models import Expense
from credits.models import Credit
from reinvestments.models import Reinvestment


class DashboardSummaryView(APIView):
    """Get dashboard summary with all key metrics"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Sales metrics
        total_revenue = Sale.objects.filter(user=user).aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        total_profit = sum(sale.profit for sale in Sale.objects.filter(user=user))
        
        # Expense metrics
        total_expenses = Expense.objects.filter(user=user).aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        # Net profit
        net_profit = total_profit - total_expenses
        
        # Inventory metrics
        products = Product.objects.filter(user=user)
        inventory_value = sum(p.inventory_value for p in products)
        
        # Credit metrics
        credit_outstanding = Credit.objects.filter(
            user=user,
            status__in=['pending', 'partial', 'overdue']
        ).aggregate(
            total=Sum('remaining_balance')
        )['total'] or 0
        
        # Reinvestment metrics
        total_reinvestment = Reinvestment.objects.filter(user=user).aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        # Personal withdrawals
        personal_withdrawals = Expense.objects.filter(
            user=user,
            category='personal_withdrawal'
        ).aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        # Calculate capital
        cash_available = total_revenue - total_expenses - total_reinvestment
        current_capital = cash_available + inventory_value + credit_outstanding
        
        # Recent activity
        recent_sales = Sale.objects.filter(user=user).order_by('-created_at')[:5]
        recent_expenses = Expense.objects.filter(user=user).order_by('-created_at')[:5]
        
        # Low stock alerts
        low_stock_products = [p for p in products if p.is_low_stock]
        
        # Overdue credits
        overdue_credits = Credit.objects.filter(user=user, status='overdue').count()
        
        from sales.serializers import SaleSerializer
        from expenses.serializers import ExpenseSerializer
        
        return Response({
            'summary': {
                'total_revenue': float(total_revenue),
                'total_expenses': float(total_expenses),
                'net_profit': float(net_profit),
                'current_capital': float(current_capital),
                'cash_available': float(cash_available),
                'inventory_value': float(inventory_value),
                'credit_outstanding': float(credit_outstanding),
                'total_reinvestment': float(total_reinvestment),
                'personal_withdrawals': float(personal_withdrawals),
            },
            'recent_activity': {
                'sales': SaleSerializer(recent_sales, many=True).data,
                'expenses': ExpenseSerializer(recent_expenses, many=True).data,
            },
            'alerts': {
                'low_stock_count': len(low_stock_products),
                'overdue_credits': overdue_credits,
                'negative_cashflow': cash_available < 0,
            }
        })


class CapitalCalculatorView(APIView):
    """Calculate business capital"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Calculate components
        products = Product.objects.filter(user=user)
        inventory_value = sum(p.inventory_value for p in products)
        
        credit_receivables = Credit.objects.filter(
            user=user,
            status__in=['pending', 'partial', 'overdue']
        ).aggregate(
            total=Sum('remaining_balance')
        )['total'] or 0
        
        total_revenue = Sale.objects.filter(user=user).aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        total_expenses = Expense.objects.filter(user=user).aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        total_reinvestment = Reinvestment.objects.filter(user=user).aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        cash_available = total_revenue - total_expenses - total_reinvestment
        
        # Calculate capital
        current_capital = cash_available + inventory_value + credit_receivables
        
        return Response({
            'current_capital': float(current_capital),
            'cash_available': float(cash_available),
            'inventory_value': float(inventory_value),
            'credit_receivables': float(credit_receivables),
            'breakdown': {
                'total_revenue': float(total_revenue),
                'total_expenses': float(total_expenses),
                'total_reinvestment': float(total_reinvestment),
            }
        })


class CashflowView(APIView):
    """Track cashflow - money in and money out"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Get date range from query params
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        sales_qs = Sale.objects.filter(user=user)
        expenses_qs = Expense.objects.filter(user=user)
        reinvestments_qs = Reinvestment.objects.filter(user=user)
        
        if start_date:
            sales_qs = sales_qs.filter(created_at__gte=start_date)
            expenses_qs = expenses_qs.filter(date__gte=start_date)
            reinvestments_qs = reinvestments_qs.filter(date__gte=start_date)
        
        if end_date:
            sales_qs = sales_qs.filter(created_at__lte=end_date)
            expenses_qs = expenses_qs.filter(date__lte=end_date)
            reinvestments_qs = reinvestments_qs.filter(date__lte=end_date)
        
        # Money in
        sales_revenue = sales_qs.aggregate(total=Sum('total_amount'))['total'] or 0
        credit_payments = Credit.objects.filter(
            user=user,
            payments__created_at__gte=start_date if start_date else datetime.min,
            payments__created_at__lte=end_date if end_date else datetime.now()
        ).aggregate(total=Sum('payments__amount'))['total'] or 0
        
        money_in = sales_revenue + credit_payments
        
        # Money out
        expenses_total = expenses_qs.aggregate(total=Sum('amount'))['total'] or 0
        reinvestments_total = reinvestments_qs.aggregate(total=Sum('amount'))['total'] or 0
        withdrawals = expenses_qs.filter(
            category='personal_withdrawal'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        money_out = expenses_total + reinvestments_total
        
        # Net cashflow
        net_cashflow = money_in - money_out
        
        return Response({
            'money_in': {
                'total': float(money_in),
                'sales': float(sales_revenue),
                'credit_payments': float(credit_payments),
            },
            'money_out': {
                'total': float(money_out),
                'expenses': float(expenses_total),
                'reinvestments': float(reinvestments_total),
                'withdrawals': float(withdrawals),
            },
            'net_cashflow': float(net_cashflow),
            'warning': net_cashflow < 0
        })


class ReportsView(APIView):
    """Generate business reports"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        report_type = request.query_params.get('type', 'daily')
        
        # Calculate date range based on report type
        end_date = datetime.now()
        
        if report_type == 'daily':
            start_date = end_date.replace(hour=0, minute=0, second=0, microsecond=0)
        elif report_type == 'weekly':
            start_date = end_date - timedelta(days=7)
        elif report_type == 'monthly':
            start_date = end_date - timedelta(days=30)
        else:
            # Custom date range
            start_date = request.query_params.get('start_date', end_date - timedelta(days=30))
            end_date = request.query_params.get('end_date', end_date)
        
        # Sales data
        sales = Sale.objects.filter(
            user=user,
            created_at__gte=start_date,
            created_at__lte=end_date
        )
        
        total_sales = sales.aggregate(total=Sum('total_amount'))['total'] or 0
        total_profit = sum(sale.profit for sale in sales)
        
        # Expenses data
        expenses = Expense.objects.filter(
            user=user,
            date__gte=start_date.date() if hasattr(start_date, 'date') else start_date,
            date__lte=end_date.date() if hasattr(end_date, 'date') else end_date
        )
        
        total_expenses = expenses.aggregate(total=Sum('amount'))['total'] or 0
        
        # Credits data
        credits = Credit.objects.filter(
            user=user,
            created_at__gte=start_date,
            created_at__lte=end_date
        )
        
        total_credit_issued = credits.aggregate(total=Sum('amount_owed'))['total'] or 0
        total_credit_collected = credits.aggregate(total=Sum('amount_paid'))['total'] or 0
        
        return Response({
            'report_type': report_type,
            'period': {
                'start': start_date,
                'end': end_date,
            },
            'sales': {
                'total_sales': float(total_sales),
                'total_profit': float(total_profit),
                'transaction_count': sales.count(),
            },
            'expenses': {
                'total_expenses': float(total_expenses),
                'expense_count': expenses.count(),
            },
            'credits': {
                'total_issued': float(total_credit_issued),
                'total_collected': float(total_credit_collected),
                'credit_count': credits.count(),
            },
            'net_profit': float(total_profit - total_expenses),
        })



class ProjectionsView(APIView):
    """30-day business projections"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Get all sales and expenses
        sales = Sale.objects.filter(user=user)
        expenses = Expense.objects.filter(user=user)
        
        # Calculate averages
        total_sales = sales.aggregate(total=Sum('total_amount'))['total'] or 0
        total_profit = sum(sale.profit for sale in sales)
        total_expenses = expenses.aggregate(total=Sum('amount'))['total'] or 0
        
        sales_count = sales.count()
        expense_count = expenses.count()
        
        # Calculate average transaction value and average expense
        avg_transaction = total_sales / sales_count if sales_count > 0 else 0
        avg_expense = total_expenses / expense_count if expense_count > 0 else 0
        
        # 30-day projections
        projected_revenue = avg_transaction * 30
        projected_expenses = avg_expense * 30
        projected_profit = projected_revenue - projected_expenses
        
        # Outstanding credit
        outstanding_credit = Credit.objects.filter(
            user=user,
            status__in=['pending', 'partial', 'overdue']
        ).aggregate(total=Sum('remaining_balance'))['total'] or 0
        
        # Expected total income (projected revenue + outstanding credit)
        expected_income = projected_revenue + outstanding_credit
        
        # Get daily sales for trend
        thirty_days_ago = datetime.now() - timedelta(days=30)
        daily_sales = Sale.objects.filter(
            user=user,
            created_at__gte=thirty_days_ago
        ).extra(
            select={'day': 'date(created_at)'}
        ).values('day').annotate(
            total=Sum('total_amount'),
            count=Count('id')
        ).order_by('day')
        
        return Response({
            'current_metrics': {
                'total_sales': float(total_sales),
                'total_profit': float(total_profit),
                'total_expenses': float(total_expenses),
                'sales_count': sales_count,
                'expense_count': expense_count,
            },
            'averages': {
                'avg_transaction': float(avg_transaction),
                'avg_expense': float(avg_expense),
            },
            'projections_30_days': {
                'projected_revenue': float(projected_revenue),
                'projected_expenses': float(projected_expenses),
                'projected_profit': float(projected_profit),
                'outstanding_credit': float(outstanding_credit),
                'expected_income': float(expected_income),
            },
            'daily_trend': list(daily_sales),
            'insights': {
                'is_profitable': projected_profit > 0,
                'profit_margin': (projected_profit / projected_revenue * 100) if projected_revenue > 0 else 0,
                'credit_recovery_impact': float(outstanding_credit),
            }
        })
