from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db.models import Sum, Count
from django.db.models.functions import TruncDate
from django.db import transaction
from django.utils import timezone
from decimal import Decimal
from datetime import datetime, timedelta, time

from products.models import Product
from sales.models import Sale
from expenses.models import Expense
from credits.models import Credit
from customers.models import Customer
from reinvestments.models import Reinvestment
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated as DRFIsAuthenticated
from .openai_client import call_openai_responses, OpenAIError


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
        sales_count = Sale.objects.filter(user=user).count()
        products_count = products.count()
        customers_count = Customer.objects.filter(user=user).count()
        expenses_count = Expense.objects.filter(user=user).count()
        credits_count = Credit.objects.filter(user=user).count()
        reinvestments_count = Reinvestment.objects.filter(user=user).count()
        
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
            },
            'record_counts': {
                'sales': sales_count,
                'products': products_count,
                'customers': customers_count,
                'expenses': expenses_count,
                'credits': credits_count,
                'reinvestments': reinvestments_count,
                'total': sales_count + products_count + customers_count + expenses_count + credits_count + reinvestments_count,
            }
        })


class SeedDemoDataView(APIView):
    """Create demo data for a user so dashboards and charts are populated."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        today = timezone.localdate()

        product_specs = [
            {
                'name': 'Demo Rice 25kg',
                'sku': f'DEMO-{user.id}-RICE',
                'category': 'groceries',
                'buying_price': Decimal('220.00'),
                'selling_price': Decimal('295.00'),
                'quantity': 120,
                'minimum_stock': 20,
            },
            {
                'name': 'Demo Cooking Oil',
                'sku': f'DEMO-{user.id}-OIL',
                'category': 'groceries',
                'buying_price': Decimal('95.00'),
                'selling_price': Decimal('135.00'),
                'quantity': 90,
                'minimum_stock': 15,
            },
            {
                'name': 'Demo Laundry Soap',
                'sku': f'DEMO-{user.id}-SOAP',
                'category': 'household',
                'buying_price': Decimal('18.00'),
                'selling_price': Decimal('28.00'),
                'quantity': 180,
                'minimum_stock': 30,
            },
        ]

        customer_specs = [
            {'name': 'Demo Customer One', 'phone': '0970000001'},
            {'name': 'Demo Customer Two', 'phone': '0970000002'},
        ]

        with transaction.atomic():
            products = {}
            for spec in product_specs:
                product, _ = Product.objects.get_or_create(
                    user=user,
                    sku=spec['sku'],
                    defaults={
                        'name': spec['name'],
                        'category': spec['category'],
                        'buying_price': spec['buying_price'],
                        'selling_price': spec['selling_price'],
                        'quantity': spec['quantity'],
                        'minimum_stock': spec['minimum_stock'],
                        'supplier': 'Demo Supplier',
                        'description': 'Seeded demo inventory item',
                    },
                )
                products[spec['sku']] = product

            customers = []
            for index, spec in enumerate(customer_specs, start=1):
                customer, _ = Customer.objects.get_or_create(
                    user=user,
                    phone=spec['phone'],
                    defaults={
                        'name': spec['name'],
                        'email': f'demo{index}@example.com',
                        'address': 'Demo address',
                        'notes': 'Seeded demo customer',
                    },
                )
                customers.append(customer)

            if not Sale.objects.filter(user=user, notes='Demo seed').exists():
                sale_rows = [
                    (products[f'DEMO-{user.id}-RICE'], customers[0], 6, 5, today - timedelta(days=1), 'cash'),
                    (products[f'DEMO-{user.id}-OIL'], customers[1], 3, 3, today - timedelta(days=4), 'mobile_money'),
                    (products[f'DEMO-{user.id}-SOAP'], None, 10, 2, today - timedelta(days=6), 'cash'),
                    (products[f'DEMO-{user.id}-RICE'], customers[1], 4, 12, today - timedelta(days=9), 'credit'),
                    (products[f'DEMO-{user.id}-OIL'], None, 2, 8, today - timedelta(days=13), 'cash'),
                    (products[f'DEMO-{user.id}-SOAP'], customers[0], 8, 7, today - timedelta(days=18), 'mobile_money'),
                ]

                for product, customer, quantity, days_ago, sale_date, payment_type in sale_rows:
                    sale = Sale.objects.create(
                        user=user,
                        product=product,
                        customer=customer,
                        quantity=quantity,
                        unit_price=product.selling_price,
                        payment_type=payment_type,
                        deposit_amount=Decimal('0.00') if payment_type != 'credit' else Decimal('40.00'),
                        due_date=sale_date + timedelta(days=14) if payment_type == 'credit' else None,
                        notes='Demo seed',
                    )
                    # ensure created_at is timezone-aware when backdating
                    aware_dt = timezone.make_aware(datetime.combine(sale_date, time(hour=12)))
                    Sale.objects.filter(pk=sale.pk).update(created_at=aware_dt)

            if not Expense.objects.filter(user=user, title__startswith='Demo ').exists():
                expense_rows = [
                    ('Demo Rent', Decimal('1200.00'), 'rent', today - timedelta(days=2)),
                    ('Demo Utilities', Decimal('260.00'), 'utilities', today - timedelta(days=5)),
                    ('Demo Marketing', Decimal('180.00'), 'marketing', today - timedelta(days=8)),
                    ('Demo Transport', Decimal('95.00'), 'transport', today - timedelta(days=15)),
                ]

                for title, amount, category, expense_date in expense_rows:
                    Expense.objects.create(
                        user=user,
                        title=title,
                        amount=amount,
                        category=category,
                        date=expense_date,
                        notes='Demo seed',
                    )

            if not Reinvestment.objects.filter(user=user, notes='Demo seed').exists():
                Reinvestment.objects.create(
                    user=user,
                    amount=Decimal('700.00'),
                    purpose='new_stock',
                    date=today - timedelta(days=7),
                    expected_margin=Decimal('18.00'),
                    notes='Demo seed',
                )

            if not Credit.objects.filter(user=user, notes='Demo seed').exists():
                Credit.objects.create(
                    user=user,
                    customer=customers[0],
                    amount_owed=Decimal('420.00'),
                    amount_paid=Decimal('120.00'),
                    borrow_date=today - timedelta(days=12),
                    due_date=today + timedelta(days=5),
                    notes='Demo seed',
                )

        sales_count = Sale.objects.filter(user=user).count()
        expenses_count = Expense.objects.filter(user=user).count()
        products_count = Product.objects.filter(user=user).count()
        customers_count = Customer.objects.filter(user=user).count()
        credits_count = Credit.objects.filter(user=user).count()
        reinvestments_count = Reinvestment.objects.filter(user=user).count()

        return Response(
            {
                'message': 'Demo data loaded successfully',
                'counts': {
                    'sales': sales_count,
                    'expenses': expenses_count,
                    'products': products_count,
                    'customers': customers_count,
                    'credits': credits_count,
                    'reinvestments': reinvestments_count,
                    'total': sales_count + expenses_count + products_count + customers_count + credits_count + reinvestments_count,
                },
            },
            status=status.HTTP_201_CREATED,
        )


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
        ).annotate(day=TruncDate('created_at')).values('day').annotate(
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



class MonthlyAnalyticsView(APIView):
    """Monthly breakdown analytics (Jan-Dec)"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        year = request.query_params.get('year', datetime.now().year)
        
        # Initialize months
        months = []
        for month in range(1, 13):
            month_start = datetime(int(year), month, 1)
            if month == 12:
                month_end = datetime(int(year) + 1, 1, 1)
            else:
                month_end = datetime(int(year), month + 1, 1)
            
            # Sales for this month
            month_sales = Sale.objects.filter(
                user=user,
                created_at__gte=month_start,
                created_at__lt=month_end
            )
            
            # Expenses for this month
            month_expenses = Expense.objects.filter(
                user=user,
                date__gte=month_start.date(),
                date__lt=month_end.date()
            )
            
            # Credits for this month
            month_credits = Credit.objects.filter(
                user=user,
                created_at__gte=month_start,
                created_at__lt=month_end
            )
            
            total_sales = month_sales.aggregate(total=Sum('total_amount'))['total'] or 0
            total_profit = sum(sale.profit for sale in month_sales)
            total_expenses = month_expenses.aggregate(total=Sum('amount'))['total'] or 0
            net_profit = total_profit - total_expenses
            
            months.append({
                'month': month,
                'month_name': month_start.strftime('%B'),
                'month_short': month_start.strftime('%b'),
                'total_sales': float(total_sales),
                'total_profit': float(total_profit),
                'total_expenses': float(total_expenses),
                'net_profit': float(net_profit),
                'transaction_count': month_sales.count(),
                'credit_issued': float(month_credits.aggregate(total=Sum('amount_owed'))['total'] or 0),
                'credit_collected': float(month_credits.aggregate(total=Sum('amount_paid'))['total'] or 0),
            })
        
        # Year totals
        year_totals = {
            'total_sales': sum(m['total_sales'] for m in months),
            'total_profit': sum(m['total_profit'] for m in months),
            'total_expenses': sum(m['total_expenses'] for m in months),
            'net_profit': sum(m['net_profit'] for m in months),
            'transaction_count': sum(m['transaction_count'] for m in months),
        }
        
        return Response({
            'year': year,
            'months': months,
            'year_totals': year_totals,
        })


class ComprehensiveReportView(APIView):
    """Generate comprehensive PDF report"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        report_type = request.query_params.get('type', 'monthly')
        month = request.query_params.get('month')
        year = request.query_params.get('year', datetime.now().year)
        
        # Determine date range
        if report_type == 'monthly' and month:
            start_date = datetime(int(year), int(month), 1)
            if int(month) == 12:
                end_date = datetime(int(year) + 1, 1, 1)
            else:
                end_date = datetime(int(year), int(month) + 1, 1)
        elif report_type == 'yearly':
            start_date = datetime(int(year), 1, 1)
            end_date = datetime(int(year) + 1, 1, 1)
        else:
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            if start_date:
                start_date = datetime.fromisoformat(start_date)
            if end_date:
                end_date = datetime.fromisoformat(end_date)
        
        # Gather comprehensive data
        sales = Sale.objects.filter(
            user=user,
            created_at__gte=start_date,
            created_at__lt=end_date
        ).select_related('product', 'customer')
        
        expenses = Expense.objects.filter(
            user=user,
            date__gte=start_date.date(),
            date__lt=end_date.date()
        )
        
        credits = Credit.objects.filter(
            user=user,
            created_at__gte=start_date,
            created_at__lt=end_date
        ).select_related('customer')
        
        products = Product.objects.filter(user=user)
        customers = Customer.objects.filter(user=user)
        
        # Sales analysis
        total_sales = sales.aggregate(total=Sum('total_amount'))['total'] or 0
        total_profit = sum(sale.profit for sale in sales)
        
        sales_by_payment = {}
        for payment_type in ['cash', 'mobile_money', 'credit']:
            sales_by_payment[payment_type] = sales.filter(
                payment_type=payment_type
            ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        # Top products
        top_products = sales.values(
            'product__name'
        ).annotate(
            total_quantity=Sum('quantity'),
            total_revenue=Sum('total_amount'),
            total_profit=Sum('total_amount')
        ).order_by('-total_revenue')[:10]
        
        # Expense analysis
        total_expenses = expenses.aggregate(total=Sum('amount'))['total'] or 0
        
        expenses_by_category = {}
        for category, _ in Expense.CATEGORY_CHOICES:
            expenses_by_category[category] = expenses.filter(
                category=category
            ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Credit analysis
        total_credit_issued = credits.aggregate(total=Sum('amount_owed'))['total'] or 0
        total_credit_collected = credits.aggregate(total=Sum('amount_paid'))['total'] or 0
        outstanding_credit = credits.filter(
            status__in=['pending', 'partial', 'overdue']
        ).aggregate(total=Sum('remaining_balance'))['total'] or 0
        
        # Top debtors
        top_debtors = credits.filter(
            status__in=['pending', 'partial', 'overdue']
        ).select_related('customer').order_by('-remaining_balance')[:10]
        
        # Inventory analysis
        inventory_value = sum(p.inventory_value for p in products)
        low_stock_products = [p for p in products if p.is_low_stock]
        
        # Customer analysis
        top_customers = []
        for customer in customers:
            customer_sales = sales.filter(customer=customer)
            if customer_sales.exists():
                top_customers.append({
                    'name': customer.name,
                    'total_purchases': float(customer_sales.aggregate(total=Sum('total_amount'))['total'] or 0),
                    'transaction_count': customer_sales.count(),
                })
        top_customers = sorted(top_customers, key=lambda x: x['total_purchases'], reverse=True)[:10]
        
        # Financial summary
        net_profit = total_profit - total_expenses
        profit_margin = (total_profit / total_sales * 100) if total_sales > 0 else 0
        
        report_data = {
            'report_info': {
                'type': report_type,
                'period': {
                    'start': start_date.isoformat(),
                    'end': end_date.isoformat(),
                    'label': start_date.strftime('%B %Y') if report_type == 'monthly' else f'Year {year}'
                },
                'generated_at': datetime.now().isoformat(),
                'business_name': user.business_name or 'Your Business',
                'currency': user.currency,
            },
            'executive_summary': {
                'total_sales': float(total_sales),
                'total_profit': float(total_profit),
                'total_expenses': float(total_expenses),
                'net_profit': float(net_profit),
                'profit_margin': float(profit_margin),
                'transaction_count': sales.count(),
            },
            'sales_analysis': {
                'total_sales': float(total_sales),
                'by_payment_type': {k: float(v) for k, v in sales_by_payment.items()},
                'top_products': [
                    {
                        'name': item['product__name'],
                        'quantity': item['total_quantity'],
                        'revenue': float(item['total_revenue']),
                    }
                    for item in top_products
                ],
                'daily_average': float(total_sales / max((end_date - start_date).days, 1)),
            },
            'expense_analysis': {
                'total_expenses': float(total_expenses),
                'by_category': {k: float(v) for k, v in expenses_by_category.items()},
                'largest_expenses': [
                    {
                        'title': exp.title,
                        'amount': float(exp.amount),
                        'category': exp.category,
                        'date': exp.date.isoformat(),
                    }
                    for exp in expenses.order_by('-amount')[:10]
                ],
            },
            'credit_analysis': {
                'total_issued': float(total_credit_issued),
                'total_collected': float(total_credit_collected),
                'outstanding': float(outstanding_credit),
                'collection_rate': float((total_credit_collected / total_credit_issued * 100) if total_credit_issued > 0 else 0),
                'top_debtors': [
                    {
                        'customer': credit.customer.name,
                        'amount_owed': float(credit.remaining_balance),
                        'due_date': credit.due_date.isoformat() if credit.due_date else None,
                        'status': credit.status,
                    }
                    for credit in top_debtors
                ],
            },
            'inventory_analysis': {
                'total_products': products.count(),
                'inventory_value': float(inventory_value),
                'low_stock_count': len(low_stock_products),
                'low_stock_products': [
                    {
                        'name': p.name,
                        'quantity': p.quantity,
                        'minimum_stock': p.minimum_stock,
                    }
                    for p in low_stock_products[:10]
                ],
            },
            'customer_analysis': {
                'total_customers': customers.count(),
                'top_customers': top_customers,
            },
            'recommendations': self.generate_recommendations(
                net_profit, profit_margin, outstanding_credit, len(low_stock_products)
            ),
        }
        
        return Response(report_data)
    
    def generate_recommendations(self, net_profit, profit_margin, outstanding_credit, low_stock_count):
        recommendations = []
        
        if net_profit < 0:
            recommendations.append({
                'type': 'warning',
                'title': 'Negative Profit',
                'message': 'Your expenses exceed your profits. Review and reduce unnecessary expenses.'
            })
        
        if profit_margin < 20:
            recommendations.append({
                'type': 'info',
                'title': 'Low Profit Margin',
                'message': 'Consider increasing prices or reducing costs to improve profit margins.'
            })
        
        if outstanding_credit > 0:
            recommendations.append({
                'type': 'warning',
                'title': 'Outstanding Credit',
                'message': f'You have outstanding credit. Follow up with customers to collect payments.'
            })
        
        if low_stock_count > 0:
            recommendations.append({
                'type': 'alert',
                'title': 'Low Stock Alert',
                'message': f'{low_stock_count} product(s) are running low. Restock soon to avoid lost sales.'
            })
        
        if net_profit > 0 and profit_margin > 20:
            recommendations.append({
                'type': 'success',
                'title': 'Healthy Business',
                'message': 'Your business is performing well. Consider reinvesting profits for growth.'
            })
        
        return recommendations


@api_view(['POST'])
@permission_classes([DRFIsAuthenticated])
def ai_query(request):
    """Proxy endpoint to call OpenAI Router Responses API from the server.

    Expects JSON: { "input": "user prompt text" }
    Requires authenticated user.
    """
    user = request.user
    prompt = request.data.get('input') or request.data.get('prompt') or ''

    if not prompt:
        return Response({'detail': 'No input provided'}, status=status.HTTP_400_BAD_REQUEST)

    payload = {
        'input': [
            {
                'role': 'user',
                'content': prompt,
            }
        ]
    }

    try:
        resp = call_openai_responses(payload)
    except OpenAIError as exc:
        return Response({'detail': str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

    # Normalize a simple text output when possible
    result_text = None
    try:
        if isinstance(resp, dict) and 'output' in resp:
            parts = []
            for item in resp.get('output', []):
                for c in item.get('content', []):
                    if isinstance(c, dict) and 'text' in c:
                        parts.append(c['text'])
                    elif isinstance(c, str):
                        parts.append(c)
            result_text = '\n'.join(parts) if parts else resp
        else:
            result_text = resp
    except Exception:
        result_text = resp

    return Response({'result': result_text, 'raw': resp})
