import asyncio
import websockets
import json
import sys
import importlib
import os
import pandas as pd
import numpy as np
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("computation_engine.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("ComputationEngine")

class ComputationEngine:yte_hex_encryption_key
    def __init__(self, port=8081):
        self.port = port
        self.models = {}ort=8081):
        self.data_cache = {}
        self.models = {}
        self.data_cache = {}
        
    async def start(self):
        """Start the WebSocket server"""
        uri = f"ws://localhost:{self.port}"
        logger.info(f"Starting computation engine, connecting to {uri}")
        
        async with websockets.connect(uri) as websocket:
            logger.info("Connected to integration server")
            
            # Send initial status message
            await websocket.send(json.dumps({
                "type": "status",
                "status": "connected",
                "engine": "python",
                "timestamp": datetime.now().isoformat()
            }))
            
            # Main processing loop
            while True:
                try:
                    # Receive data from integration server
                    message = await websocket.recv()
                    data = json.loads(message)
                    logger.info(f"Received message: {data}")
                    
                    # Process the message
                    result = await self.process_message(data)
                    
                    # Send result back if there is one
                    if result:
                        await websocket.send(json.dumps({
                            "type": "result",
                            "data": result,
                            "timestamp": datetime.now().isoformat()
                        }))
                        
                except Exception as e:
                    logger.error(f"Error processing message: {e}")
    
    async def process_message(self, message):
        """Process incoming messages based on type"""
        message_type = message.get("type")
        
        if message_type == "alert":
            # Process TradingView alert
            return await self.process_alert(message)
        elif message_type == "market_data":
            # Process market data update
            return await self.process_market_data(message)
        elif message_type == "model_request":
            # Load or run a specific model
            return await self.process_model_request(message)
        else:
            logger.warning(f"Unknown message type: {message_type}")
            return None
            
    async def process_alert(self, alert):
        """Process TradingView alert"""
        try:
            # Extract alert information
            indicator = alert.get("indicator")
            symbol = alert.get("ticker")
            values = alert.get("values", {})
            
            # Find appropriate model for this indicator
            model = self._get_model_for_indicator(indicator)
            
            # Process with model
            result = model.process(symbol, values)
            
            # Determine if we should generate a signal
            if result.get("signal"):
                return {
                    "type": "signal",
                    "symbol": symbol,
                    "action": result["signal"],
                    "quantity": self._calculate_position_size(symbol, result),
                    "price": result.get("price"),
                    "confidence": result.get("confidence", 0.5),
                    "source": indicator
                }
            
            return {"status": "processed", "no_signal": True}
            
        except Exception as e:
            logger.error(f"Error processing alert: {e}")
            return {"status": "error", "message": str(e)}
    
    async def process_market_data(self, data):
        """Process market data update"""
        symbol = data.get("symbol")
        bars = data.get("bars")
        
        if not symbol or not bars:
            return {"status": "error", "message": "Missing symbol or data"}
        
        # Convert to DataFrame
        df = pd.DataFrame(bars)
        
        # Cache the data
        self.data_cache[symbol] = df
        
        return {"status": "success", "message": f"Cached data for {symbol}"}
    
    async def process_model_request(self, request):
        """Process request to load or run a specific model"""
        model_name = request.get("model")
        action = request.get("action")
        params = request.get("params", {})
        
        if not model_name or not action:
            return {"status": "error", "message": "Missing model name or action"}
        
        try:
            # Get or load the model
            model = self._get_model(model_name)
            
            if action == "run":
                # Run the model with given parameters
                result = model.run(**params)
                return {"status": "success", "result": result}
            elif action == "info":
                # Return model information
                return {"status": "success", "info": model.get_info()}
            else:
                return {"status": "error", "message": f"Unknown action: {action}"}
                
        except Exception as e:
            logger.error(f"Error processing model request: {e}")
            return {"status": "error", "message": str(e)}
    
    def _get_model_for_indicator(self, indicator_name):
        """Get appropriate model for an indicator"""
        # Try to load a specific model for this indicator
        try:
            return self._get_model(indicator_name.lower().replace(" ", "_"))
        except ImportError:
            # Fall back to generic model
            from models.generic import GenericModel
            return GenericModel()
    
    def _get_model(self, model_name):
        """Load a model by name (with caching)"""
        if model_name in self.models:
            return self.models[model_name]
        
        try:
            # Try to import the model
            module = importlib.import_module(f"models.{model_name}")
            model_class = getattr(module, f"{model_name.capitalize()}Model")
            model = model_class()
            
            # Cache the model
            self.models[model_name] = model
            return model
        except (ImportError, AttributeError) as e:
            logger.error(f"Error loading model {model_name}: {e}")
            raise
    
    def _calculate_position_size(self, symbol, result):
        """Calculate position size based on confidence and risk settings"""
        # Simple position sizing based on confidence
        confidence = result.get("confidence", 0.5)
        
        # Base position size on confidence level
        if confidence > 0.8:
            return 1.0  # Full position
        elif confidence > 0.6:
            return 0.5  # Half position
        else:
            return 0.25  # Quarter position

# Main entry point
if __name__ == "__main__":
    if len(sys.argv) > 1:
        port = int(sys.argv[1])
    else:
        port = 8081  # Default port
    
    # Ensure the models directory is in the path
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    
    # Start the engine


    asyncio.run(engine.start())    engine = ComputationEngine(port)
const credentialsManager = require('./src/execution/broker/credentials-manager');





});  // Any other required fields  password: 'your_password',  username: 'your_username',credentialsManager.saveCredentials('ibkr', {
// Save your credentials (run once to encrypt them)