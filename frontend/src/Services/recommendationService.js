// src/Services/recommendationService.js
import { 
  getTrainingFrequencyStats, 
  getTimeSinceLastImprovement, 
  getSkillImbalanceAnalysis 
} from './statService';

// Generate training recommendations
export const generateTrainingRecommendations = async (userId) => {
  try {
    // Get all the necessary stats
    const frequencyStats = await getTrainingFrequencyStats(userId);
    const timeSinceLastImprovement = await getTimeSinceLastImprovement(userId);
    const imbalanceAnalysis = await getSkillImbalanceAnalysis(userId);
    
    const recommendations = [];
    
    // Recommendation based on training frequency
    if (frequencyStats.avgSessionsPerWeek < 3) {
      recommendations.push({
        type: 'frequency',
        priority: 'high',
        message: 'Increase your training frequency to at least 3 sessions per week for optimal improvement.',
        actionable: 'Schedule 3 training sessions this week.'
      });
    }
    
    // Recommendation based on skill imbalance
    if (imbalanceAnalysis.imbalanceScore > 20) {
      recommendations.push({
        type: 'imbalance',
        priority: 'high',
        message: `Your ${imbalanceAnalysis.weakestSkill.name} skill is significantly lower than your ${imbalanceAnalysis.strongestSkill.name} skill.`,
        actionable: `Focus on improving your ${imbalanceAnalysis.weakestSkill.name} skill in your next few sessions.`
      });
    }
    
    // Recommendations based on time since last improvement
    Object.entries(timeSinceLastImprovement).forEach(([skill, data]) => {
      if (data && data.daysSince > 14) {
        recommendations.push({
          type: 'stagnation',
          priority: data.daysSince > 30 ? 'high' : 'medium',
          message: `It's been ${data.daysSince} days since you improved your ${skill} skill.`,
          actionable: `Schedule a focused ${skill} training session this week.`
        });
      }
    });
    
    // Sort recommendations by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    return recommendations;
  } catch (error) {
    console.error("Error generating recommendations:", error);
    throw error;
  }
};

// Generate skill-specific recommendations
export const generateSkillRecommendations = async (userId, skillName) => {
  try {
    const timeSinceLastImprovement = await getTimeSinceLastImprovement(userId);
    const skillData = timeSinceLastImprovement[skillName];
    
    const recommendations = [];
    
    // Basic recommendations based on the skill
    const skillSpecificDrills = {
      dribbling: [
        { title: "Cone Weaving", description: "Set up cones in a zigzag pattern and practice dribbling through them quickly." },
        { title: "Close Control", description: "Practice dribbling in tight spaces, focusing on quick touches and direction changes." }
      ],
      shooting: [
        { title: "Target Practice", description: "Set up targets in the corners of the goal and aim for precision." },
        { title: "Power Shots", description: "Practice shooting with power from outside the box." }
      ],
      passing: [
        { title: "Wall Passes", description: "Practice passing against a wall, focusing on accuracy and receiving." },
        { title: "Partner Passing", description: "Work with a partner on one-touch passing and movement." }
      ],
      defending: [
        { title: "Shadow Defending", description: "Practice staying in front of an attacker without committing to a tackle." },
        { title: "Tackle Timing", description: "Work on timing your tackles to win the ball cleanly." }
      ],
      speed: [
        { title: "Sprint Intervals", description: "Alternate between sprinting and jogging to build explosive speed." },
        { title: "Agility Ladder", description: "Use an agility ladder for quick footwork drills." }
      ],
      stamina: [
        { title: "Endurance Runs", description: "Run at a moderate pace for extended periods to build stamina." },
        { title: "HIIT Training", description: "High-intensity interval training to improve cardiovascular fitness." }
      ]
    };
    
    // Add skill-specific drills
    if (skillSpecificDrills[skillName]) {
      skillSpecificDrills[skillName].forEach(drill => {
        recommendations.push({
          type: 'drill',
          priority: 'medium',
          message: drill.title,
          actionable: drill.description
        });
      });
    }
    
    // Add recommendation based on time since last improvement
    if (skillData && skillData.daysSince > 7) {
      recommendations.push({
        type: 'stagnation',
        priority: skillData.daysSince > 30 ? 'high' : 'medium',
        message: `It's been ${skillData.daysSince} days since you improved your ${skillName} skill.`,
        actionable: `Dedicate more time to ${skillName} training this week.`
      });
    }
    
    return recommendations;
  } catch (error) {
    console.error(`Error generating recommendations for ${skillName}:`, error);
    throw error;
  }
};