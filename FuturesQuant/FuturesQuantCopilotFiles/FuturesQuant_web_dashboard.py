#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Dashboard Module for FuturesQuant - Provides web interface with verbose trade display
"""

from flask import Flask, render_template, request, jsonify, Blueprint
import pandas as pd
import plotly.graph_objs as go
import plotly.express as px
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create blueprint for the dashboard
dashboard_bp = Blueprint('dashboard', __name__)

# Global settings
VERBOSE_MODE = False  # Default to standard mode

class DashboardManager:
    """Manages dashboard data and rendering"""
    
    def __init__(self):
        self.trade_history = []
        self.performance_data = {}
        self.strategy_metrics = {}
        self.verbose_mode = VERBOSE_MODE
        self.positions = {}
        self.leverage_data = {}
    
    def update_trade_history(self, new_trades: List[Dict[str, Any]]) -> None:
        """Add new trades to history"""
        self.trade_history.extend(new_trades)
        # Keep limited history in memory
        if len(self.trade_history) > 1000:
            self.trade_history = self.trade_history[-1000:]
        logger.info(f"Trade history updated, now contains {len(self.trade_history)} entries")
    
    def update_positions(self, positions: Dict[str, Any]) -> None:
        """Update current positions data"""
        self.positions = positions
    
    def update_leverage_data(self, leverage_data: Dict[str, Any]) -> None:
        """Update leverage metrics from leverage agent"""
        self.leverage_data = leverage_data
    
    def update_performance(self, performance_data: Dict[str, Any]) -> None:
        """Update performance metrics"""
        self.performance_data = performance_data
    
    def toggle_verbose_mode(self) -> bool:
        """Toggle verbose mode on/off"""
        self.verbose_mode = not self.verbose_mode
        global VERBOSE_MODE
        VERBOSE_MODE = self.verbose_mode
        logger.info(f"Verbose mode toggled to: {self.verbose_mode}")
        return self.verbose_mode
    
    def get_dashboard_data(self) -> Dict[str, Any]:
        """Get complete dashboard data payload"""
        return {
            'trade_history': self._process_trade_history(),
            'positions': self.positions,
            'performance': self.performance_data,
            'leverage': self.leverage_data,
            'verbose_mode': self.verbose_mode,
            'timestamp': datetime.now().isoformat(),
            'strategy_metrics': self.strategy_metrics
        }
    
    def _process_trade_history(self) -> List[Dict[str, Any]]:
        """Process trade history based on verbose mode"""
        if not self.verbose_mode:
            # Standard mode - return simplified trade history
            return [{
                'timestamp': trade['timestamp'],
                'instrument': trade['instrument'],
                'side': trade['side'],
                'size': trade['size'],
                'price': trade['price'],
                'pnl': trade.get('pnl', 'N/A')
            } for trade in self.trade_history[-50:]]  # Only return most recent 50 trades
        else:
            # Verbose mode - return detailed trade information
            return self.trade_history[-100:]  # Return more trades in verbose mode


# Create singleton instance
dashboard_manager = DashboardManager()

@dashboard_bp.route('/')
def dashboard_home():
    """Main dashboard page"""
    return render_template(
        'dashboard.html', 
        verbose_mode=dashboard_manager.verbose_mode
    )

@dashboard_bp.route('/api/data')
def get_dashboard_data():
    """API endpoint to get dashboard data"""
    return jsonify(dashboard_manager.get_dashboard_data())

@dashboard_bp.route('/api/toggle_verbose', methods=['POST'])
def toggle_verbose():
    """API endpoint to toggle verbose mode"""
    new_state = dashboard_manager.toggle_verbose_mode()
    return jsonify({'verbose_mode': new_state})

@dashboard_bp.route('/api/trades')
def get_trades():
    """API endpoint to get trade history"""
    limit = request.args.get('limit', 50, type=int)
    offset = request.args.get('offset', 0, type=int)
    
    trades = dashboard_manager._process_trade_history()
    subset = trades[offset:offset+limit] if offset < len(trades) else []
    
    return jsonify({
        'trades': subset,
        'total': len(trades),
        'verbose_mode': dashboard_manager.verbose_mode
    })

def register_blueprint(app: Flask) -> None:
    """Register the dashboard blueprint with the Flask app"""
    app.register_blueprint(dashboard_bp, url_prefix='/dashboard')