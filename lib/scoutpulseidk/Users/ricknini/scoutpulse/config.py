import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Base configuration class"""
    
    # Flask Settings
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    
    # Database Configuration
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///scoutpulse.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
    }
    
    # Security Settings
    WTF_CSRF_ENABLED = True
    WTF_CSRF_TIME_LIMIT = 3600
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    PERMANENT_SESSION_LIFETIME = timedelta(hours=24)
    
    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or SECRET_KEY
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # Upload Settings
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER') or 'uploads'
    ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'mp4', 'mov', 'avi'}
    
    # Email Configuration
    MAIL_SERVER = os.environ.get('MAIL_SERVER') or 'localhost'
    MAIL_PORT = int(os.environ.get('MAIL_PORT') or 587)
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'true').lower() in ['true', 'on', '1']
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER') or 'noreply@scoutpulse.com'
    
    # Redis Configuration (for caching and sessions)
    REDIS_URL = os.environ.get('REDIS_URL') or 'redis://localhost:6379/0'
    CACHE_TYPE = 'redis' if os.environ.get('REDIS_URL') else 'simple'
    CACHE_REDIS_URL = REDIS_URL
    CACHE_DEFAULT_TIMEOUT = 300
    
    # API Keys and External Services
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
    YOUTUBE_API_KEY = os.environ.get('YOUTUBE_API_KEY')
    HUDL_API_KEY = os.environ.get('HUDL_API_KEY')
    
    # Application Settings
    APP_NAME = 'ScoutPulse'
    APP_VERSION = '1.0.0'
    DEFAULT_TIMEZONE = 'UTC'
    ITEMS_PER_PAGE = 20
    
    # Security Headers
    SECURITY_HEADERS = {
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:; media-src 'self' https:;",
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
    
    # Logging Configuration
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO').upper()
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    LOG_FILE = os.environ.get('LOG_FILE', 'logs/scoutpulse.log')
    
    @staticmethod
    def init_app(app):
        """Initialize application with configuration"""
        pass

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False
    SESSION_COOKIE_SECURE = False
    WTF_CSRF_ENABLED = False
    LOG_LEVEL = 'DEBUG'
    
    # Override security headers for development
    SECURITY_HEADERS = {
        **Config.SECURITY_HEADERS,
        'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' data: https: blob:; connect-src 'self' ws: wss: https:; media-src 'self' https: blob:;"
    }

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False
    
    # Production database should be PostgreSQL
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'postgresql://user:pass@localhost/scoutpulse'
    
    # Enhanced security for production
    SESSION_COOKIE_SECURE = True
    PREFERRED_URL_SCHEME = 'https'
    
    @classmethod
    def init_app(cls, app):
        """Production-specific initialization"""
        Config.init_app(app)
        
        # Log to syslog in production
        import logging
        from logging.handlers import SysLogHandler
        syslog_handler = SysLogHandler()
        syslog_handler.setLevel(logging.WARNING)
        app.logger.addHandler(syslog_handler)

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    DEBUG = True
    WTF_CSRF_ENABLED = False
    SESSION_COOKIE_SECURE = False
    
    # Use in-memory database for testing
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    
    # Disable external API calls during testing
    OPENAI_API_KEY = 'test-key'
    YOUTUBE_API_KEY = 'test-key'
    HUDL_API_KEY = 'test-key'

# Configuration mapping
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

def get_config():
    """Get configuration based on environment"""
    return config[os.environ.get('FLASK_ENV', 'default')]

# Database Models Configuration
DATABASE_MODELS = {
    'users': {
        'table_name': 'users',
        'primary_key': 'id',
        'indexes': ['email', 'username', 'created_at']
    },
    'teams': {
        'table_name': 'teams',
        'primary_key': 'id',
        'indexes': ['name', 'coach_id', 'season']
    },
    'players': {
        'table_name': 'players',
        'primary_key': 'id',
        'indexes': ['team_id', 'position', 'jersey_number']
    },
    'games': {
        'table_name': 'games',
        'primary_key': 'id',
        'indexes': ['team_id', 'opponent_id', 'game_date']
    },
    'player_stats': {
        'table_name': 'player_stats',
        'primary_key': 'id',
        'indexes': ['player_id', 'game_id', 'stat_type']
    },
    'videos': {
        'table_name': 'videos',
        'primary_key': 'id',
        'indexes': ['game_id', 'player_id', 'video_type']
    },
    'reports': {
        'table_name': 'reports',
        'primary_key': 'id',
        'indexes': ['created_by', 'report_type', 'created_at']
    }
}

# API Rate Limiting
RATE_LIMITS = {
    'default': '100 per hour',
    'auth': '5 per minute',
    'upload': '10 per hour',
    'api': '1000 per hour'
}

# Feature Flags
FEATURES = {
    'ai_analysis': os.environ.get('FEATURE_AI_ANALYSIS', 'true').lower() == 'true',
    'video_upload': os.environ.get('FEATURE_VIDEO_UPLOAD', 'true').lower() == 'true',
    'live_scoring': os.environ.get('FEATURE_LIVE_SCORING', 'true').lower() == 'true',
    'advanced_stats': os.environ.get('FEATURE_ADVANCED_STATS', 'true').lower() == 'true',
    'team_messaging': os.environ.get('FEATURE_TEAM_MESSAGING', 'false').lower() == 'true'
}