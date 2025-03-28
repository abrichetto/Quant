import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    POLYGON_API_KEY = os.getenv("POLYGON_API_KEY")
    TWELVEDATA_API_KEY = os.getenv("TWELVEDATA_API_KEY")

    @staticmethod
    def validate():
        if not Config.POLYGON_API_KEY:
            raise ValueError("Polygon API key not found. Please add it to your .env file.")
        if not Config.TWELVEDATA_API_KEY:
            raise ValueError("Twelve Data API key not found. Please add it to your .env file.")

# Validate configuration on import
Config.validate()