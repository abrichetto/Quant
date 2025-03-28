"""
Signal Agent module - Responsible for generating trading signals
"""
import logging
from typing import Dict, List, Any

logger = logging.getLogger(__name__)

class SignalAgent:
    """
    SignalAgent analyzes market data and generates trading signals
    """
    
    def __init__(self, config=None):
        """
        Initialize the SignalAgent
        
        Args:
            config (Dict): Configuration parameters for the agent
        """
        self.config = config or {}
        self.models = []
        self.active = True
        logger.info("Initialized SignalAgent")
        
    def register_model(self, model):
        """
        Register a prediction model with the signal agent
        
        Args:
            model: The model to register
        """
        self.models.append(model)
        logger.info(f"Registered model: {type(model).__name__}")
        
    def generate_signals(self, market_data) -> List[Dict[str, Any]]:
        """
        Generate trading signals based on market data
        
        Args:
            market_data: Market data to analyze
            
        Returns:
            List of trading signals as dictionaries
        """
        signals = []
        
        if not self.active:
            logger.warning("Signal agent is inactive - no signals generated")
            return signals
            
        logger.info("Generating signals from market data")
        
        # Apply each registered model to generate signals
        for model in self.models:
            try:
                model_signals = model.predict(market_data)
                signals.extend(model_signals)
                logger.debug(f"Model {type(model).__name__} generated {len(model_signals)} signals")
            except Exception as e:
                logger.error(f"Error generating signals with model {type(model).__name__}: {str(e)}")
                
        # Additional signal processing logic could be added here
        
        logger.info(f"Generated {len(signals)} total signals")
        return signals
        
    def get_status(self) -> Dict[str, Any]:
        """
        Get the current status of the signal agent
        
        Returns:
            Dictionary with status information
        """
        return {
            "active": self.active,
            "registered_models": len(self.models),
            "model_types": [type(model).__name__ for model in self.models]
        }