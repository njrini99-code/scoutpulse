from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileAllowed
from wtforms import StringField, TextAreaField, SelectField, IntegerField, FloatField, PasswordField, BooleanField, DateField, EmailField
from wtforms.validators import DataRequired, Length, Email, EqualTo, NumberRange, Optional, ValidationError
from werkzeug.security import check_password_hash
from models import User
import re

class LoginForm(FlaskForm):
    email = EmailField('Email', validators=[
        DataRequired(message='Email is required'),
        Email(message='Please enter a valid email address')
    ], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300',
        'placeholder': 'Enter your email'
    })
    
    password = PasswordField('Password', validators=[
        DataRequired(message='Password is required'),
        Length(min=8, message='Password must be at least 8 characters long')
    ], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300',
        'placeholder': 'Enter your password'
    })
    
    remember_me = BooleanField('Remember me', render_kw={
        'class': 'w-4 h-4 text-purple-600 bg-white/10 border-white/15 rounded focus:ring-purple-500 focus:ring-2'
    })

class RegisterForm(FlaskForm):
    first_name = StringField('First Name', validators=[
        DataRequired(message='First name is required'),
        Length(min=2, max=50, message='First name must be between 2 and 50 characters')
    ], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300',
        'placeholder': 'Enter your first name'
    })
    
    last_name = StringField('Last Name', validators=[
        DataRequired(message='Last name is required'),
        Length(min=2, max=50, message='Last name must be between 2 and 50 characters')
    ], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300',
        'placeholder': 'Enter your last name'
    })
    
    email = EmailField('Email', validators=[
        DataRequired(message='Email is required'),
        Email(message='Please enter a valid email address')
    ], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300',
        'placeholder': 'Enter your email'
    })
    
    organization = StringField('Organization', validators=[
        DataRequired(message='Organization is required'),
        Length(min=2, max=100, message='Organization must be between 2 and 100 characters')
    ], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300',
        'placeholder': 'Enter your organization'
    })
    
    role = SelectField('Role', choices=[
        ('scout', 'Scout'),
        ('coach', 'Coach'),
        ('recruiter', 'Recruiter'),
        ('analyst', 'Analyst')
    ], validators=[DataRequired(message='Please select a role')], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300'
    })
    
    password = PasswordField('Password', validators=[
        DataRequired(message='Password is required'),
        Length(min=8, message='Password must be at least 8 characters long')
    ], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300',
        'placeholder': 'Create a password'
    })
    
    confirm_password = PasswordField('Confirm Password', validators=[
        DataRequired(message='Please confirm your password'),
        EqualTo('password', message='Passwords must match')
    ], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300',
        'placeholder': 'Confirm your password'
    })
    
    def validate_email(self, email):
        user = User.query.filter_by(email=email.data.lower()).first()
        if user:
            raise ValidationError('Email already registered. Please choose a different one.')

class PlayerRegistrationForm(FlaskForm):
    first_name = StringField('First Name', validators=[
        DataRequired(message='First name is required'),
        Length(min=2, max=50, message='First name must be between 2 and 50 characters')
    ], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300',
        'placeholder': 'Player first name'
    })
    
    last_name = StringField('Last Name', validators=[
        DataRequired(message='Last name is required'),
        Length(min=2, max=50, message='Last name must be between 2 and 50 characters')
    ], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300',
        'placeholder': 'Player last name'
    })
    
    date_of_birth = DateField('Date of Birth', validators=[
        DataRequired(message='Date of birth is required')
    ], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300'
    })
    
    position = SelectField('Primary Position', choices=[
        ('goalkeeper', 'Goalkeeper'),
        ('center_back', 'Center Back'),
        ('left_back', 'Left Back'),
        ('right_back', 'Right Back'),
        ('defensive_midfielder', 'Defensive Midfielder'),
        ('central_midfielder', 'Central Midfielder'),
        ('attacking_midfielder', 'Attacking Midfielder'),
        ('left_midfielder', 'Left Midfielder'),
        ('right_midfielder', 'Right Midfielder'),
        ('left_winger', 'Left Winger'),
        ('right_winger', 'Right Winger'),
        ('striker', 'Striker'),
        ('center_forward', 'Center Forward')
    ], validators=[DataRequired(message='Please select a position')], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300'
    })
    
    secondary_position = SelectField('Secondary Position', choices=[
        ('', 'None'),
        ('goalkeeper', 'Goalkeeper'),
        ('center_back', 'Center Back'),
        ('left_back', 'Left Back'),
        ('right_back', 'Right Back'),
        ('defensive_midfielder', 'Defensive Midfielder'),
        ('central_midfielder', 'Central Midfielder'),
        ('attacking_midfielder', 'Attacking Midfielder'),
        ('left_midfielder', 'Left Midfielder'),
        ('right_midfielder', 'Right Midfielder'),
        ('left_winger', 'Left Winger'),
        ('right_winger', 'Right Winger'),
        ('striker', 'Striker'),
        ('center_forward', 'Center Forward')
    ], validators=[Optional()], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300'
    })
    
    height = IntegerField('Height (cm)', validators=[
        Optional(),
        NumberRange(min=120, max=220, message='Height must be between 120 and 220 cm')
    ], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300',
        'placeholder': 'Height in centimeters'
    })
    
    weight = IntegerField('Weight (kg)', validators=[
        Optional(),
        NumberRange(min=40, max=120, message='Weight must be between 40 and 120 kg')
    ], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300',
        'placeholder': 'Weight in kilograms'
    })
    
    preferred_foot = SelectField('Preferred Foot', choices=[
        ('right', 'Right'),
        ('left', 'Left'),
        ('both', 'Both')
    ], validators=[DataRequired(message='Please select preferred foot')], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300'
    })
    
    current_club = StringField('Current Club', validators=[
        Optional(),
        Length(max=100, message='Club name cannot exceed 100 characters')
    ], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300',
        'placeholder': 'Current club or team'
    })
    
    nationality = StringField('Nationality', validators=[
        DataRequired(message='Nationality is required'),
        Length(min=2, max=50, message='Nationality must be between 2 and 50 characters')
    ], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300',
        'placeholder': 'Player nationality'
    })
    
    jersey_number = IntegerField('Jersey Number', validators=[
        Optional(),
        NumberRange(min=1, max=99, message='Jersey number must be between 1 and 99')
    ], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300',
        'placeholder': 'Jersey number'
    })
    
    bio = TextAreaField('Player Bio', validators=[
        Optional(),
        Length(max=500, message='Bio cannot exceed 500 characters')
    ], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300 resize-none',
        'placeholder': 'Brief player biography...',
        'rows': '4'
    })
    
    profile_image = FileField('Profile Image', validators=[
        Optional(),
        FileAllowed(['jpg', 'jpeg', 'png', 'gif'], 'Only image files are allowed!')
    ], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-500 file:text-white hover:file:bg-purple-600 transition-all duration-300',
        'accept': 'image/*'
    })

class ScoutReportForm(FlaskForm):
    match_date = DateField('Match Date', validators=[
        DataRequired(message='Match date is required')
    ], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300'
    })
    
    opponent = StringField('Opponent', validators=[
        DataRequired(message='Opponent is required'),
        Length(min=2, max=100, message='Opponent name must be between 2 and 100 characters')
    ], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300',
        'placeholder': 'Opposing team'
    })
    
    competition = StringField('Competition', validators=[
        DataRequired(message='Competition is required'),
        Length(min=2, max=100, message='Competition name must be between 2 and 100 characters')
    ], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300',
        'placeholder': 'League or tournament'
    })
    
    minutes_played = IntegerField('Minutes Played', validators=[
        DataRequired(message='Minutes played is required'),
        NumberRange(min=0, max=120, message='Minutes must be between 0 and 120')
    ], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300',
        'placeholder': 'Minutes played'
    })
    
    position_played = SelectField('Position Played', choices=[
        ('goalkeeper', 'Goalkeeper'),
        ('center_back', 'Center Back'),
        ('left_back', 'Left Back'),
        ('right_back', 'Right Back'),
        ('defensive_midfielder', 'Defensive Midfielder'),
        ('central_midfielder', 'Central Midfielder'),
        ('attacking_midfielder', 'Attacking Midfielder'),
        ('left_midfielder', 'Left Midfielder'),
        ('right_midfielder', 'Right Midfielder'),
        ('left_winger', 'Left Winger'),
        ('right_winger', 'Right Winger'),
        ('striker', 'Striker'),
        ('center_forward', 'Center Forward')
    ], validators=[DataRequired(message='Please select position played')], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300'
    })
    
    # Technical Skills (1-10 scale)
    ball_control = FloatField('Ball Control', validators=[
        DataRequired(message='Ball control rating is required'),
        NumberRange(min=1, max=10, message='Rating must be between 1 and 10')
    ], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300',
        'placeholder': '1-10 scale',
        'step': '0.5',
        'min': '1',
        'max': '10'
    })
    
    passing = FloatField('Passing', validators=[
        DataRequired(message='Passing rating is required'),
        NumberRange(min=1, max=10, message='Rating must be between 1 and 10')
    ], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300',
        'placeholder': '1-10 scale',
        'step': '0.5',
        'min': '1',
        'max': '10'
    })
    
    shooting = FloatField('Shooting', validators=[
        DataRequired(message='Shooting rating is required'),
        NumberRange(min=1, max=10, message='Rating must be between 1 and 10')
    ], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300',
        'placeholder': '1-10 scale',
        'step': '0.5',
        'min': '1',
        'max': '10'
    })
    
    dribbling = FloatField('Dribbling', validators=[
        DataRequired(message='Dribbling rating is required'),
        NumberRange(min=1, max=10, message='Rating must be between 1 and 10')
    ], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300',
        'placeholder': '1-10 scale',
        'step': '0.5',
        'min': '1',
        'max': '10'
    })
    
    # Physical Attributes
    speed = FloatField('Speed', validators=[
        DataRequired(message='Speed rating is required'),
        NumberRange(min=1, max=10, message='Rating must be between 1 and 10')
    ], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300',
        'placeholder': '1-10 scale',
        'step': '0.5',
        'min': '1',
        'max': '10'
    })
    
    strength = FloatField('Strength', validators=[
        DataRequired(message='Strength rating is required'),
        NumberRange(min=1, max=10, message='Rating must be between 1 and 10')
    ], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300',
        'placeholder': '1-10 scale',
        'step': '0.5',
        'min': '1',
        'max': '10'
    })
    
    stamina = FloatField('Stamina', validators=[
        DataRequired(message='Stamina rating is required'),
        NumberRange(min=1, max=10, message='Rating must be between 1 and 10')
    ], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300',
        'placeholder': '1-10 scale',
        'step': '0.5',
        'min': '1',
        'max': '10'
    })
    
    # Mental Attributes
    decision_making = FloatField('Decision Making', validators=[
        DataRequired(message='Decision making rating is required'),
        NumberRange(min=1, max=10, message='Rating must be between 1 and 10')
    ], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300',
        'placeholder': '1-10 scale',
        'step': '0.5',
        'min': '1',
        'max': '10'
    })
    
    work_rate = FloatField('Work Rate', validators=[
        DataRequired(message='Work rate rating is required'),
        NumberRange(min=1, max=10, message='Rating must be between 1 and 10')
    ], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300',
        'placeholder': '1-10 scale',
        'step': '0.5',
        'min': '1',
        'max': '10'
    })
    
    teamwork = FloatField('Teamwork', validators=[
        DataRequired(message='Teamwork rating is required'),
        NumberRange(min=1, max=10, message='Rating must be between 1 and 10')
    ], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300',
        'placeholder': '1-10 scale',
        'step': '0.5',
        'min': '1',
        'max': '10'
    })
    
    # Overall Assessment
    overall_rating = FloatField('Overall Rating', validators=[
        DataRequired(message='Overall rating is required'),
        NumberRange(min=1, max=10, message='Rating must be between 1 and 10')
    ], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300',
        'placeholder': '1-10 scale',
        'step': '0.5',
        'min': '1',
        'max': '10'
    })
    
    potential_rating = FloatField('Potential Rating', validators=[
        DataRequired(message='Potential rating is required'),
        NumberRange(min=1, max=10, message='Rating must be between 1 and 10')
    ], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300',
        'placeholder': '1-10 scale',
        'step': '0.5',
        'min': '1',
        'max': '10'
    })
    
    # Written Assessment
    strengths = TextAreaField('Key Strengths', validators=[
        DataRequired(message='Key strengths are required'),
        Length(min=10, max=1000, message='Strengths must be between 10 and 1000 characters')
    ], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300 resize-none',
        'placeholder': 'Describe the player\'s key strengths...',
        'rows': '4'
    })
    
    weaknesses = TextAreaField('Areas for Improvement', validators=[
        DataRequired(message='Areas for improvement are required'),
        Length(min=10, max=1000, message='Weaknesses must be between 10 and 1000 characters')
    ], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300 resize-none',
        'placeholder': 'Describe areas where the player can improve...',
        'rows': '4'
    })
    
    summary = TextAreaField('Summary', validators=[
        DataRequired(message='Summary is required'),
        Length(min=20, max=1500, message='Summary must be between 20 and 1500 characters')
    ], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300 resize-none',
        'placeholder': 'Overall assessment and recommendations...',
        'rows': '6'
    })
    
    recommendation = SelectField('Recommendation', choices=[
        ('sign_immediately', 'Sign Immediately'),
        ('monitor_closely', 'Monitor Closely'),
        ('continue_watching', 'Continue Watching'),
        ('not_recommended', 'Not Recommended')
    ], validators=[DataRequired(message='Please select a recommendation')], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300'
    })

class SearchPlayerForm(FlaskForm):
    query = StringField('Search Players', validators=[
        Optional(),
        Length(max=100, message='Search query cannot exceed 100 characters')
    ], render_kw={
        'class': 'w-full px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300',
        'placeholder': 'Search by name, position, or club...'
    })
    
    position_filter = SelectField('Position', choices=[
        ('', 'All Positions'),
        ('goalkeeper', 'Goalkeeper'),
        ('defender', 'Defender'),
        ('midfielder', 'Midfielder'),
        ('forward', 'Forward')
    ], validators=[Optional()], render_kw={
        'class': 'px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-lg text-white focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300'
    })
    
    age_min = IntegerField('Min Age', validators=[
        Optional(),
        NumberRange(min=16, max=40, message='Age must be between 16 and 40')
    ], render_