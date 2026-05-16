from django.urls import path
from .views import (
    DashboardSummaryView,
    CapitalCalculatorView,
    CashflowView,
    ReportsView,
    ProjectionsView,
    MonthlyAnalyticsView,
    ComprehensiveReportView
)

urlpatterns = [
    path('dashboard/', DashboardSummaryView.as_view(), name='dashboard'),
    path('capital/', CapitalCalculatorView.as_view(), name='capital'),
    path('cashflow/', CashflowView.as_view(), name='cashflow'),
    path('reports/', ReportsView.as_view(), name='reports'),
    path('projections/', ProjectionsView.as_view(), name='projections'),
    path('monthly/', MonthlyAnalyticsView.as_view(), name='monthly'),
    path('comprehensive-report/', ComprehensiveReportView.as_view(), name='comprehensive_report'),
]
