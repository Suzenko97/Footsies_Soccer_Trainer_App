import React, { useState } from 'react';
import { auth } from '../Config/firebase';
import { trackTrainingSession } from '../Services';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faStopwatch, faCalendarAlt, faTachometerAlt, faBullseye, faRunning, faFutbol } from '@fortawesome/free-solid-svg-icons';

const SessionForm = ({ onSessionSaved, onCancel }) => {
    const [formData, setFormData] = useState({
        title: '',
        duration: 30,
        date: new Date().toISOString().split('T')[0],
        skillsFocus: 'dribbling',
        dribbling: 0,
        shooting: 0,
        passing: 0,
        stamina: 0,
        intensity: 5,
        notes: ''
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        let processedValue = value;
        
        // Convert numeric fields to numbers
        if (['duration', 'dribbling', 'shooting', 'passing', 'stamina', 'intensity'].includes(name)) {
            processedValue = parseInt(value, 10) || 0;
        }
        
        setFormData({
            ...formData,
            [name]: processedValue
        });
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const user = auth.currentUser;
            if (!user) {
                throw new Error('User not authenticated');
            }
            
            // Track the session in Firestore
            await trackTrainingSession(user.uid, formData);
            
            // Call the onSessionSaved callback
            if (onSessionSaved) {
                onSessionSaved(formData);
            }
        } catch (error) {
            console.error('Error saving session:', error);
            setError('Failed to save session. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    
    // Function to render the skill rating input
    const renderSkillRating = (name, label, icon) => (
        <div className="mb-3">
            <label className="form-label d-flex align-items-center">
                <FontAwesomeIcon icon={icon} className="me-2" style={{ color: getSkillColor(name) }} />
                {label} Rating (0-10)
            </label>
            <div className="range-container">
                <input
                    type="range"
                    className="form-range"
                    name={name}
                    min="0"
                    max="10"
                    value={formData[name]}
                    onChange={handleChange}
                />
                <div className="d-flex justify-content-between">
                    <span>Low</span>
                    <span className="fw-bold">{formData[name]}</span>
                    <span>High</span>
                </div>
            </div>
        </div>
    );
    
    // Get color for each skill
    const getSkillColor = (skill) => {
        switch (skill) {
            case 'dribbling': return '#007bff';
            case 'shooting': return '#dc3545';
            case 'passing': return '#fd7e14';
            case 'stamina': return '#28a745';
            default: return '#6c757d';
        }
    };
    
    return (
        <div className="card">
            <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                    <FontAwesomeIcon icon={faStopwatch} className="me-2" />
                    Record Training Session
                </h5>
            </div>
            <div className="card-body">
                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}
                
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="title" className="form-label">Session Title</label>
                        <input
                            type="text"
                            className="form-control"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g. Morning Practice, Shooting Drills, etc."
                            required
                        />
                    </div>
                    
                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label htmlFor="duration" className="form-label d-flex align-items-center">
                                <FontAwesomeIcon icon={faStopwatch} className="me-2" />
                                Duration (minutes)
                            </label>
                            <input
                                type="number"
                                className="form-control"
                                id="duration"
                                name="duration"
                                value={formData.duration}
                                onChange={handleChange}
                                min="1"
                                max="300"
                                required
                            />
                        </div>
                        
                        <div className="col-md-6 mb-3">
                            <label htmlFor="date" className="form-label d-flex align-items-center">
                                <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                                Date
                            </label>
                            <input
                                type="date"
                                className="form-control"
                                id="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>
                    
                    <div className="mb-3">
                        <label htmlFor="skillsFocus" className="form-label d-flex align-items-center">
                            <FontAwesomeIcon icon={faTachometerAlt} className="me-2" />
                            Primary Focus
                        </label>
                        <select
                            className="form-select"
                            id="skillsFocus"
                            name="skillsFocus"
                            value={formData.skillsFocus}
                            onChange={handleChange}
                        >
                            <option value="dribbling">Dribbling</option>
                            <option value="shooting">Shooting</option>
                            <option value="passing">Passing</option>
                            <option value="stamina">Stamina/Conditioning</option>
                            <option value="general">General Practice</option>
                        </select>
                    </div>
                    
                    <div className="mb-3">
                        <label htmlFor="intensity" className="form-label d-flex align-items-center">
                            <FontAwesomeIcon icon={faTachometerAlt} className="me-2" />
                            Intensity (1-10)
                        </label>
                        <div className="range-container">
                            <input
                                type="range"
                                className="form-range"
                                id="intensity"
                                name="intensity"
                                min="1"
                                max="10"
                                value={formData.intensity}
                                onChange={handleChange}
                            />
                            <div className="d-flex justify-content-between">
                                <span>Light</span>
                                <span className="fw-bold">{formData.intensity}</span>
                                <span>Intense</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="card mb-3">
                        <div className="card-header">
                            <h6 className="mb-0">Rate Your Performance</h6>
                        </div>
                        <div className="card-body">
                            {renderSkillRating('dribbling', 'Dribbling', faFutbol)}
                            {renderSkillRating('shooting', 'Shooting', faBullseye)}
                            {renderSkillRating('passing', 'Passing', faFutbol)}
                            {renderSkillRating('stamina', 'Stamina', faRunning)}
                        </div>
                    </div>
                    
                    <div className="mb-3">
                        <label htmlFor="notes" className="form-label">Notes</label>
                        <textarea
                            className="form-control"
                            id="notes"
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows="3"
                            placeholder="What went well? What could be improved?"
                        ></textarea>
                    </div>
                    
                    <div className="d-flex justify-content-between">
                        <button 
                            type="button"
                            className="btn btn-secondary"
                            onClick={onCancel}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon={faSave} className="me-2" />
                                    Save Session
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SessionForm;
