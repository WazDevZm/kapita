from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q
from datetime import datetime, timedelta
import anthropic
from decouple import config

from products.models import Product
from sales.models import Sale
from customers.models import Customer
from credits.models import Credit
from expenses.models import Expense


class ChatAssistantView(APIView):
    """AI Chat Assistant powered by Claude API"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_message = request.data.get('message', '')
        
        if not user_message:
            return Response({'error': 'Message is required'}, status=400)

        # Gather business context
        context = self.get_business_context(request.user)
        
        # Create system prompt with business data
        system_prompt = self.create_system_prompt(context)
        
        try:
            # Call Claude API
            client = anthropic.Anthropic(
                api_key=config('ANTHROPIC_API_KEY', default='')
            )
            
            message = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1024,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": user_message}
                ]
            )
            
            assistant_response = message.content[0].text
            
            return Response({
                'response': assistant_response,
                'context_used': True
            })
            
        except Exception as e:
            return Response({
                'error': f'Failed to get AI response: {str(e)}'
            }, status=500)

    def get_business_context(self, user):
        """Gather all relevant business data for context"""
        
        # Sales data
        sales = Sale.objects.filter(user=user)
        total_sales = sales.aggregate(total=Sum('total_amount'))['total'] or 0
        total_profit = sum(sale.profit for sale in sales)
        
        # Payment type breakdown
        cash_sales = sales.filter(payment_type='cash').aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        mobile_sales = sales.filter(payment_type='mobile_money').aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        credit_sales = sales.filter(payment_type='credit').aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        # Expenses
        expenses = Expense.objects.filter(user=user)
        total_expenses = expenses.aggregate(total=Sum('amount'))['total'] or 0
        
        # Credits
        credits = Credit.objects.filter(user=user)
        outstanding_credit = credits.filter(
            status__in=['pending', 'partial', 'overdue']
        ).aggregate(total=Sum('remaining_balance'))['total'] or 0
        
        overdue_credits = credits.filter(status='overdue')
        
        # Top debtors
        top_debtors = credits.filter(
            status__in=['pending', 'partial', 'overdue']
        ).select_related('customer').order_by('-remaining_balance')[:5]
        
        # Products
        products = Product.objects.filter(user=user)
        low_stock_products = [p for p in products if p.is_low_stock]
        
        # Top selling products
        top_products = sales.values(
            'product__name'
        ).annotate(
            total_quantity=Sum('quantity'),
            total_revenue=Sum('total_amount')
        ).order_by('-total_revenue')[:5]
        
        # Customers
        customers = Customer.objects.filter(user=user)
        
        # Recent sales (last 7 days)
        seven_days_ago = datetime.now() - timedelta(days=7)
        recent_sales = sales.filter(created_at__gte=seven_days_ago)
        
        # Capital calculation
        inventory_value = sum(p.inventory_value for p in products)
        cash_available = total_sales - total_expenses
        current_capital = cash_available + inventory_value + outstanding_credit
        
        return {
            'business_name': user.business_name or 'Your Business',
            'currency': user.currency,
            'total_sales': float(total_sales),
            'total_profit': float(total_profit),
            'total_expenses': float(total_expenses),
            'cash_available': float(cash_available),
            'current_capital': float(current_capital),
            'inventory_value': float(inventory_value),
            'outstanding_credit': float(outstanding_credit),
            'cash_sales': float(cash_sales),
            'mobile_sales': float(mobile_sales),
            'credit_sales': float(credit_sales),
            'total_products': products.count(),
            'low_stock_count': len(low_stock_products),
            'total_customers': customers.count(),
            'overdue_credits_count': overdue_credits.count(),
            'recent_sales_count': recent_sales.count(),
            'top_debtors': [
                {
                    'name': credit.customer.name,
                    'amount': float(credit.remaining_balance)
                }
                for credit in top_debtors
            ],
            'top_products': [
                {
                    'name': item['product__name'],
                    'revenue': float(item['total_revenue']),
                    'quantity': item['total_quantity']
                }
                for item in top_products
            ],
            'low_stock_products': [
                {
                    'name': p.name,
                    'quantity': p.quantity,
                    'minimum': p.minimum_stock
                }
                for p in low_stock_products[:5]
            ]
        }

    def create_system_prompt(self, context):
        """Create system prompt with business context"""
        return f"""You are a helpful business assistant for {context['business_name']}, 
a small business in Zambia. You have access to their real-time business data and can 
answer questions about their finances, inventory, sales, and customers.

CURRENT BUSINESS DATA:
- Currency: {context['currency']}
- Total Sales: {context['currency']} {context['total_sales']:,.2f}
- Total Profit: {context['currency']} {context['total_profit']:,.2f}
- Total Expenses: {context['currency']} {context['total_expenses']:,.2f}
- Cash Available: {context['currency']} {context['cash_available']:,.2f}
- Current Capital: {context['currency']} {context['current_capital']:,.2f}
- Inventory Value: {context['currency']} {context['inventory_value']:,.2f}
- Outstanding Credit: {context['currency']} {context['outstanding_credit']:,.2f}

SALES BREAKDOWN:
- Cash Sales: {context['currency']} {context['cash_sales']:,.2f}
- Mobile Money Sales: {context['currency']} {context['mobile_sales']:,.2f}
- Credit Sales: {context['currency']} {context['credit_sales']:,.2f}

INVENTORY:
- Total Products: {context['total_products']}
- Low Stock Items: {context['low_stock_count']}

CUSTOMERS:
- Total Customers: {context['total_customers']}
- Overdue Credits: {context['overdue_credits_count']}

TOP DEBTORS:
{chr(10).join([f"- {d['name']}: {context['currency']} {d['amount']:,.2f}" for d in context['top_debtors']])}

TOP SELLING PRODUCTS:
{chr(10).join([f"- {p['name']}: {context['currency']} {p['revenue']:,.2f} ({p['quantity']} units)" for p in context['top_products']])}

LOW STOCK ALERTS:
{chr(10).join([f"- {p['name']}: {p['quantity']} units (min: {p['minimum']})" for p in context['low_stock_products']])}

RECENT ACTIVITY:
- Sales in last 7 days: {context['recent_sales_count']}

Answer questions about the business using this data. Be helpful, concise, and provide 
actionable insights. When discussing money, always use {context['currency']} as the currency.
If asked about profitability, consider both profit and expenses. If asked about cash flow,
explain the difference between revenue and available cash."""
