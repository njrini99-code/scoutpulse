from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import os
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///scoutpulse.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# User model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(20), default='scout')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

# Scout Report model
class ScoutReport(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    player_name = db.Column(db.String(100), nullable=False)
    position = db.Column(db.String(20), nullable=False)
    team = db.Column(db.String(100), nullable=False)
    overall_rating = db.Column(db.Integer, nullable=False)
    technical_skills = db.Column(db.Integer, nullable=False)
    physical_attributes = db.Column(db.Integer, nullable=False)
    mental_attributes = db.Column(db.Integer, nullable=False)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref=db.backref('reports', lazy=True))

# Authentication decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# Routes
@app.route('/')
def index():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return redirect(url_for('dashboard'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            session['user_id'] = user.id
            session['username'] = user.username
            session['role'] = user.role
            flash('Login successful!', 'success')
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password', 'error')
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        confirm_password = request.form['confirm_password']
        
        if password != confirm_password:
            flash('Passwords do not match', 'error')
            return render_template('register.html')
        
        if User.query.filter_by(username=username).first():
            flash('Username already exists', 'error')
            return render_template('register.html')
        
        if User.query.filter_by(email=email).first():
            flash('Email already exists', 'error')
            return render_template('register.html')
        
        user = User(username=username, email=email)
        user.set_password(password)
        
        try:
            db.session.add(user)
            db.session.commit()
            flash('Registration successful! Please login.', 'success')
            return redirect(url_for('login'))
        except:
            db.session.rollback()
            flash('Registration failed. Please try again.', 'error')
    
    return render_template('register.html')

@app.route('/logout')
@login_required
def logout():
    session.clear()
    flash('You have been logged out', 'info')
    return redirect(url_for('login'))

@app.route('/dashboard')
@login_required
def dashboard():
    user = User.query.get(session['user_id'])
    recent_reports = ScoutReport.query.filter_by(user_id=user.id).order_by(ScoutReport.created_at.desc()).limit(5).all()
    total_reports = ScoutReport.query.filter_by(user_id=user.id).count()
    
    return render_template('dashboard.html', user=user, recent_reports=recent_reports, total_reports=total_reports)

@app.route('/scout-report', methods=['GET', 'POST'])
@login_required
def scout_report():
    if request.method == 'POST':
        report = ScoutReport(
            user_id=session['user_id'],
            player_name=request.form['player_name'],
            position=request.form['position'],
            team=request.form['team'],
            overall_rating=int(request.form['overall_rating']),
            technical_skills=int(request.form['technical_skills']),
            physical_attributes=int(request.form['physical_attributes']),
            mental_attributes=int(request.form['mental_attributes']),
            notes=request.form['notes']
        )
        
        try:
            db.session.add(report)
            db.session.commit()
            flash('Scout report submitted successfully!', 'success')
            return redirect(url_for('dashboard'))
        except:
            db.session.rollback()
            flash('Failed to submit report. Please try again.', 'error')
    
    return render_template('scout_report.html')

@app.route('/reports')
@login_required
def reports():
    page = request.args.get('page', 1, type=int)
    reports = ScoutReport.query.filter_by(user_id=session['user_id']).order_by(ScoutReport.created_at.desc()).paginate(
        page=page, per_page=10, error_out=False
    )
    return render_template('reports.html', reports=reports)

@app.route('/report/<int:id>')
@login_required
def view_report(id):
    report = ScoutReport.query.filter_by(id=id, user_id=session['user_id']).first_or_404()
    return render_template('view_report.html', report=report)

@app.route('/api/user-info')
@login_required
def api_user_info():
    user = User.query.get(session['user_id'])
    return jsonify({
        'username': user.username,
        'email': user.email,
        'role': user.role,
        'total_reports': ScoutReport.query.filter_by(user_id=user.id).count()
    })

@app.route('/profile')
@login_required
def profile():
    user = User.query.get(session['user_id'])
    return render_template('profile.html', user=user)

@app.route('/update-profile', methods=['POST'])
@login_required
def update_profile():
    user = User.query.get(session['user_id'])
    
    email = request.form['email']
    if email != user.email and User.query.filter_by(email=email).first():
        flash('Email already exists', 'error')
        return redirect(url_for('profile'))
    
    user.email = email
    
    # Update password if provided
    current_password = request.form.get('current_password')
    new_password = request.form.get('new_password')
    
    if current_password and new_password:
        if user.check_password(current_password):
            user.set_password(new_password)
        else:
            flash('Current password is incorrect', 'error')
            return redirect(url_for('profile'))
    
    try:
        db.session.commit()
        flash('Profile updated successfully!', 'success')
    except:
        db.session.rollback()
        flash('Failed to update profile. Please try again.', 'error')
    
    return redirect(url_for('profile'))

# Create tables
@app.before_first_request
def create_tables():
    db.create_all()
    
    # Create default admin user if no users exist
    if not User.query.first():
        admin = User(username='admin', email='admin@scoutpulse.com', role='admin')
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()

if __name__ == '__main__':
    app.run(debug=True)