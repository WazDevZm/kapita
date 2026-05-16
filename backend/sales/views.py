from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncDate
from datetime import datetime, timedelta

from .models import Sale
from .serializers import SaleSerializer, SalesSummarySerializer


class SaleViewSet(viewsets.ModelViewSet):
    """ViewSet for Sale CRUD operations"""
    serializer_class = SaleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['payment_type', 'product', 'customer']
    search_fields = ['product__name', 'customer__name', 'notes']
    ordering_fields = ['created_at', 'total_amount', 'profit']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = Sale.objects.filter(user=self.request.user).select_related(
            'product', 'customer'
        )
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)
        
        return queryset

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get sales summary statistics"""
        sales = self.get_queryset()
        
        total_sales = sales.aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        total_profit = sum(sale.profit for sale in sales)
        
        cash_sales = sales.filter(payment_type='cash').aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        mobile_money_sales = sales.filter(payment_type='mobile_money').aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        credit_sales = sales.filter(payment_type='credit').aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        data = {
            'total_sales': total_sales,
            'total_profit': total_profit,
            'total_transactions': sales.count(),
            'cash_sales': cash_sales,
            'mobile_money_sales': mobile_money_sales,
            'credit_sales': credit_sales,
        }
        
        serializer = SalesSummarySerializer(data)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def daily_sales(self, request):
        """Get daily sales for the last 30 days"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        
        sales = Sale.objects.filter(
            user=request.user,
            created_at__gte=start_date,
            created_at__lte=end_date
        ).annotate(day=TruncDate('created_at')).values('day').annotate(
            total=Sum('total_amount'),
            count=Count('id')
        ).order_by('day')
        
        return Response(list(sales))

    @action(detail=False, methods=['get'])
    def top_products(self, request):
        """Get top selling products"""
        limit = int(request.query_params.get('limit', 10))
        
        sales = self.get_queryset().values(
            'product__id',
            'product__name'
        ).annotate(
            total_quantity=Sum('quantity'),
            total_revenue=Sum('total_amount')
        ).order_by('-total_revenue')[:limit]
        
        return Response([
            {
                'product_id': item['product__id'],
                'product_name': item['product__name'],
                'total_quantity': item['total_quantity'],
                'total_revenue': float(item['total_revenue'] or 0),
            }
            for item in sales
        ])

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent sales"""
        limit = int(request.query_params.get('limit', 10))
        sales = self.get_queryset()[:limit]
        serializer = self.get_serializer(sales, many=True)
        return Response(serializer.data)
