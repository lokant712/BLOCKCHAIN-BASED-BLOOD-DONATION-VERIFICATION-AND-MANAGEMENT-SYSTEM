// BloodLink AI Chat Service - Simple rule-based chatbot with AI fallback
class BloodLinkChatService {
  constructor() {
    this.knowledgeBase = {
      eligibility: {
        keywords: ['eligible', 'can i donate', 'qualification', 'requirements', 'who can donate'],
        response: `To be eligible to donate blood, you must:
• Be at least 18 years old
• Weigh at least 50 kg (110 lbs)
• Be in good health
• Not have donated in the last 8 weeks (whole blood)
• Not have certain medical conditions or be on certain medications

For specific questions about your eligibility, please consult with our medical staff.`
      },
      bloodTypes: {
        keywords: ['blood type', 'blood group', 'compatible', 'universal donor', 'universal recipient', 'rarest'],
        response: `Blood Type Information:
• O- is the universal donor (can give to anyone)
• AB+ is the universal recipient (can receive from anyone)
• The rarest blood type is AB- (only 1% of population)
• The most common blood type is O+ (around 38% of population)

Blood Compatibility Chart:
• O- can donate to: All blood types
• O+ can donate to: O+, A+, B+, AB+
• A- can donate to: A-, A+, AB-, AB+
• A+ can donate to: A+, AB+
• B- can donate to: B-, B+, AB-, AB+
• B+ can donate to: B+, AB+
• AB- can donate to: AB-, AB+
• AB+ can donate to: AB+`
      },
      process: {
        keywords: ['process', 'procedure', 'how to donate', 'what happens', 'steps'],
        response: `Blood Donation Process:
1. Registration - Provide your details and ID
2. Health Screening - Brief medical history and vitals check
3. Donation - Takes about 10-15 minutes
4. Recovery - Rest and have refreshments for 10-15 minutes
5. Follow-up - Receive confirmation and thank you message

The entire process usually takes about 45-60 minutes.`
      },
      frequency: {
        keywords: ['how often', 'frequency', 'wait time', 'again', 'next donation'],
        response: `Donation Frequency Guidelines:
• Whole Blood: Every 8 weeks (56 days)
• Platelets: Every 2 weeks
• Plasma: Every 4 weeks

Your body replaces the liquid part (plasma) within 24 hours, but red blood cells take about 4-8 weeks to replace.`
      },
      app: {
        keywords: ['app', 'platform', 'bloodlink', 'features', 'how to use'],
        response: `BloodLink Platform Features:
• Create urgent blood requests
• Find nearby donors instantly
• Track your donation history
• Set your availability status
• Receive emergency notifications
• Manage your profile and preferences

Navigate using the menu to access different features based on your role (Donor or Hospital).`
      },
      emergency: {
        keywords: ['urgent', 'emergency', 'critical', 'asap', 'immediately'],
        response: `For Emergency Blood Requests:
1. Hospitals can create emergency requests from their dashboard
2. The system will notify nearby compatible donors
3. Donors will receive push notifications
4. Donors can respond immediately through the app

If you're a hospital facing an emergency, use the "Create Emergency Request" button on your dashboard.`
      }
    };
  }

  findBestMatch(message) {
    const lowerMessage = message.toLowerCase();
    let bestMatch = null;
    let highestScore = 0;

    for (const [category, data] of Object.entries(this.knowledgeBase)) {
      const score = data.keywords.reduce((acc, keyword) => {
        return acc + (lowerMessage.includes(keyword.toLowerCase()) ? 1 : 0);
      }, 0);

      if (score > highestScore) {
        highestScore = score;
        bestMatch = data.response;
      }
    }

    return highestScore > 0 ? bestMatch : null;
  }

  async chat(message) {
    // Try to find a match in our knowledge base
    const knowledgeResponse = this.findBestMatch(message);
    
    if (knowledgeResponse) {
      return knowledgeResponse;
    }

    // Default fallback response
    return `Thank you for your question about "${message}". 

I'm the BloodLink AI Assistant. I can help you with:
• Blood donation eligibility requirements
• Blood type information and compatibility
• Donation process and what to expect
• How often you can donate
• How to use the BloodLink platform
• Emergency blood request procedures

Please ask me about any of these topics, or contact our support team for specific medical advice.`;
  }

  async streamChat(message, onChunk) {
    const response = await this.chat(message);
    
    // Simulate streaming
    const words = response.split(' ');
    for (let i = 0; i < words.length; i++) {
      const chunk = words[i] + ' ';
      onChunk(chunk);
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    
    return response;
  }
}

export default new BloodLinkChatService();
