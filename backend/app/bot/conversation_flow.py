"""
Conversation Flow Management
Handles the structured conversation between user and chatbot for problem diagnosis
"""
from enum import Enum
from datetime import datetime
from app.bot.gemini_service import get_gemini_service


class ConversationStage(Enum):
    """Stages of the conversation flow"""
    GREETING = "greeting"
    SERVICE_CATEGORY = "service_category"
    PROBLEM_DESCRIPTION = "problem_description"
    DETAILED_SITUATION = "detailed_situation"
    ANALYSIS = "analysis"
    SOLUTIONS = "solutions"
    RECOMMENDATION = "recommendation"
    PROVIDER_OFFER = "provider_offer"
    CLOSED = "closed"


class ServiceCategory:
    """Service categories available"""
    CATEGORIES = {
        'plumber': {
            'name': 'Plumber',
            'icon': '🔧',
            'description': 'Water leaks, pipe issues, drain problems, installation',
            'common_issues': [
                'Water leaks',
                'Drain blockage',
                'Pipe burst',
                'Water pressure issues',
                'Fixture installation',
                'Toilet problems'
            ]
        },
        'electrician': {
            'name': 'Electrician',
            'icon': '⚡',
            'description': 'Electrical faults, wiring, power issues, installations',
            'common_issues': [
                'Power outage',
                'Circuit breaker issues',
                'Faulty wiring',
                'Light installation',
                'Outlet problems',
                'Electrical surge'
            ]
        },
        'carpenter': {
            'name': 'Carpenter',
            'icon': '🪛',
            'description': 'Wood work, furniture, repairs, installations',
            'common_issues': [
                'Furniture repair',
                'Door/window issues',
                'Cabinet installation',
                'Wood damage',
                'Flooring problems',
                'Custom woodwork'
            ]
        },
        'painter': {
            'name': 'Painter',
            'icon': '🎨',
            'description': 'Interior/exterior painting, wall finishing',
            'common_issues': [
                'Interior painting',
                'Exterior painting',
                'Wall damage',
                'Color issues',
                'Surface preparation',
                'Finishing work'
            ]
        },
        'mechanic': {
            'name': 'Mechanic',
            'icon': '🚗',
            'description': 'Vehicle repairs, maintenance, diagnostics',
            'common_issues': [
                'Engine problems',
                'Brake issues',
                'Battery problems',
                'Tire damage',
                'Transmission issues',
                'Regular maintenance'
            ]
        },
        'cleaner': {
            'name': 'Cleaner',
            'icon': '🧹',
            'description': 'House cleaning, deep cleaning, maintenance',
            'common_issues': [
                'General cleaning',
                'Deep cleaning',
                'Carpet cleaning',
                'Window cleaning',
                'Post-construction cleanup',
                'Regular maintenance'
            ]
        },
        'handyman': {
            'name': 'Handyman',
            'icon': '🔨',
            'description': 'General repairs, maintenance, small projects',
            'common_issues': [
                'General repairs',
                'Assembly',
                'Hanging fixtures',
                'Minor fixes',
                'Maintenance',
                'Small renovations'
            ]
        },
        'gardener': {
            'name': 'Gardener',
            'icon': '🌿',
            'description': 'Landscaping, garden maintenance, outdoor work',
            'common_issues': [
                'Lawn maintenance',
                'Tree trimming',
                'Plant care',
                'Garden design',
                'Pest control',
                'Landscape design'
            ]
        }
    }

    @classmethod
    def get_all(cls):
        """Get all categories"""
        return cls.CATEGORIES

    @classmethod
    def get_category(cls, category_key):
        """Get specific category"""
        return cls.CATEGORIES.get(category_key)


class ConversationFlow:
    """Manages the conversation flow and diagnosis"""

    def __init__(self, user_id, session_id):
        self.user_id = user_id
        self.session_id = session_id
        self.current_stage = ConversationStage.GREETING
        self.service_category = None
        self.problem_description = None
        self.detailed_situation = None
        self.conversation_history = []
        self.created_at = datetime.utcnow()

    def get_greeting_message(self):
        """Get initial greeting message"""
        return {
            'stage': ConversationStage.GREETING.value,
            'message': "👋 Hello! I'm your QuickFix AI Assistant. I'll help you:\n\n✅ Diagnose your problem\n✅ Assess severity and urgency\n✅ Provide safety tips and DIY advice\n✅ Connect you with verified professionals\n\nLet's get started - what service do you need?",
            'next_action': 'ask_category',
            'follow_up': "What type of service do you need help with?"
        }

    def get_category_options(self):
        """Get service category options"""
        return {
            'stage': ConversationStage.SERVICE_CATEGORY.value,
            'message': "Please select the type of service you need:",
            'options': [
                {
                    'key': key,
                    'name': data['name'],
                    'icon': data['icon'],
                    'description': data['description']
                }
                for key, data in ServiceCategory.get_all().items()
            ],
            'next_action': 'get_problem_description'
        }

    def set_category(self, category_key):
        """Set the service category"""
        if category_key in ServiceCategory.get_all():
            self.service_category = category_key
            self.current_stage = ConversationStage.PROBLEM_DESCRIPTION
            category = ServiceCategory.get_category(category_key)
            return {
                'stage': ConversationStage.PROBLEM_DESCRIPTION.value,
                'message': f"I see you need a {category['name']}. What's the problem you're experiencing?",
                'suggested_issues': category['common_issues'],
                'next_action': 'ask_description'
            }
        return {'error': 'Invalid category'}

    def set_problem_description(self, description):
        """Set initial problem description and generate AI follow-up questions"""
        self.problem_description = description
        self.current_stage = ConversationStage.DETAILED_SITUATION
        
        try:
            # Use AI to generate contextual follow-up questions
            gemini = get_gemini_service()
            category_info = ServiceCategory.get_category(self.service_category)
            
            prompt = f"""You are QuickFix AI Assistant. A user needs {category_info['name']} service.
They described their problem as: "{description}"

Generate 3-4 specific, relevant follow-up questions to understand the situation better. 
Make questions practical and focused on:
1. Severity/urgency indicators
2. Safety concerns
3. Specific details needed for diagnosis
4. Timeline/when it started

Respond ONLY with a JSON array of questions:
["Question 1?", "Question 2?", "Question 3?", "Question 4?"]"""

            ai_response = gemini.get_quick_response(prompt)
            
            # Try to parse questions
            import json
            try:
                if '[' in ai_response and ']' in ai_response:
                    json_start = ai_response.index('[')
                    json_end = ai_response.rindex(']') + 1
                    questions = json.loads(ai_response[json_start:json_end])
                else:
                    questions = self._get_details_needed()
            except:
                questions = self._get_details_needed()
                
        except Exception as e:
            print(f"AI question generation failed: {e}")
            questions = self._get_details_needed()
        
        return {
            'stage': ConversationStage.DETAILED_SITUATION.value,
            'message': f"Got it. You're experiencing: {description}\n\nCould you please provide more details about the situation? For example:",
            'details_needed': questions,
            'next_action': 'ask_detailed_situation'
        }

    def _get_details_needed(self):
        """Get specific details needed based on category"""
        details_map = {
            'plumber': [
                'When did the problem start?',
                'Where is the leak/issue located?',
                'Have you noticed any water damage?',
                'What\'s the water pressure like?'
            ],
            'electrician': [
                'When did the power issue start?',
                'Which circuits are affected?',
                'Have you checked the circuit breaker?',
                'Any burning smells or sparks?'
            ],
            'carpenter': [
                'What type of damage (cracks, warping, etc.)?',
                'How long has this been happening?',
                'What\'s the material (wood type)?',
                'Is it affecting functionality?'
            ],
            'painter': [
                'What area needs painting?',
                'Current paint condition?',
                'Any color preferences?',
                'Interior or exterior?'
            ],
            'mechanic': [
                'What symptoms is the vehicle showing?',
                'When was the last service?',
                'Mileage on the vehicle?',
                'Any warning lights?'
            ],
            'cleaner': [
                'What area/size to clean?',
                'Type of cleaning needed?',
                'Any special requirements?',
                'Preferred timing?'
            ],
            'handyman': [
                'Detailed description of the task?',
                'Size/scale of the project?',
                'Any materials needed?',
                'Timeline?'
            ],
            'gardener': [
                'Area/size of garden?',
                'Type of work needed?',
                'Current garden condition?',
                'Budget/timeline?'
            ]
        }
        return details_map.get(self.service_category, [])

    def set_detailed_situation(self, detailed_info):
        """Set detailed situation and analyze using Gemini AI"""
        self.detailed_situation = detailed_info
        self.current_stage = ConversationStage.ANALYSIS
        return self.generate_ai_analysis()

    def generate_ai_analysis(self):
        """Generate intelligent analysis using Gemini AI"""
        self.current_stage = ConversationStage.SOLUTIONS
        
        try:
            # Get Gemini service
            gemini = get_gemini_service()
            
            # Get category info
            category_info = ServiceCategory.get_category(self.service_category)
            
            # Create comprehensive prompt for Gemini
            prompt = f"""You are QuickFix AI Assistant, an expert service diagnostic tool. Analyze this service request:

**Service Category:** {category_info['name']}
**Problem Description:** {self.problem_description}
**Additional Details:** {self.detailed_situation}

Provide a comprehensive analysis in the following JSON format:
{{
    "severity": "critical/high/medium/low",
    "diagnosis": "A detailed, professional diagnosis of the issue (2-3 sentences)",
    "diy_tips": ["3-4 specific, actionable DIY tips if safe to attempt"],
    "risk_factors": ["List specific risks or dangers if any"],
    "professional_needed": true/false,
    "urgency_level": "immediate/soon/can_wait",
    "estimated_time": "estimated time to fix",
    "explanation": "Explain why professional help is needed or not needed (1-2 sentences)"
}}

Guidelines:
1. Be professional but conversational and empathetic
2. Prioritize user safety - if there's ANY risk, recommend professional help
3. Provide practical, specific advice
4. Consider urgency and potential for worsening
5. Be honest about DIY limitations
6. For plumbing: watch for water damage, mold, structural issues
7. For electrical: ALWAYS recommend professional for safety
8. For mechanical: consider safety risks and warranty issues

Respond ONLY with valid JSON."""

            # Get AI response
            ai_response = gemini.get_quick_response(prompt)
            
            # Parse JSON response
            import json
            try:
                # Try to extract JSON from response
                if '{' in ai_response and '}' in ai_response:
                    json_start = ai_response.index('{')
                    json_end = ai_response.rindex('}') + 1
                    json_str = ai_response[json_start:json_end]
                    ai_data = json.loads(json_str)
                else:
                    # Fallback to rule-based if JSON parsing fails
                    raise ValueError("No JSON found in response")
                
                return {
                    'stage': ConversationStage.ANALYSIS.value,
                    'severity': ai_data.get('severity', self._assess_severity()),
                    'diagnosis': {
                        'category': self.service_category,
                        'problem': self.problem_description,
                        'details': self.detailed_situation,
                        'analysis': ai_data.get('diagnosis', self._generate_diagnosis()['analysis'])
                    },
                    'diy_solutions': ai_data.get('diy_tips', self._get_diy_solutions()),
                    'risk_assessment': ai_data.get('risk_factors', self._assess_risk()),
                    'professional_needed': ai_data.get('professional_needed', self._professional_needed()),
                    'urgency_level': ai_data.get('urgency_level', 'soon'),
                    'estimated_time': ai_data.get('estimated_time', 'Varies'),
                    'explanation': ai_data.get('explanation', ''),
                    'next_action': 'show_solutions'
                }
                
            except (json.JSONDecodeError, ValueError) as e:
                print(f"AI JSON parsing failed: {e}, using rule-based fallback")
                # Fallback to rule-based analysis
                return self.generate_analysis()
                
        except Exception as e:
            print(f"AI analysis failed: {e}, using rule-based fallback")
            # Fallback to original rule-based system
            return self.generate_analysis()

    def generate_analysis(self):
        """Generate rule-based analysis (fallback)"""
        analysis = {
            'stage': ConversationStage.ANALYSIS.value,
            'severity': self._assess_severity(),
            'diagnosis': self._generate_diagnosis(),
            'diy_solutions': self._get_diy_solutions(),
            'risk_assessment': self._assess_risk(),
            'professional_needed': self._professional_needed(),
            'next_action': 'show_solutions'
        }
        
        return analysis

    def _assess_severity(self):
        """Assess problem severity"""
        severity_keywords = {
            'critical': ['leak', 'flood', 'fire', 'shock', 'burst', 'break', 'danger'],
            'high': ['broken', 'major', 'severe', 'damage', 'fail', 'not working'],
            'medium': ['issue', 'problem', 'not ideal', 'slow'],
            'low': ['minor', 'small', 'cosmetic']
        }
        
        combined_text = f"{self.problem_description} {self.detailed_situation}".lower()
        
        for severity, keywords in severity_keywords.items():
            if any(keyword in combined_text for keyword in keywords):
                return severity
        
        return 'medium'

    def _generate_diagnosis(self):
        """Generate diagnosis based on inputs"""
        return {
            'category': self.service_category,
            'problem': self.problem_description,
            'details': self.detailed_situation,
            'analysis': f"Based on your description of {self.problem_description}, this appears to be a {self._assess_severity()}-severity issue with your {ServiceCategory.get_category(self.service_category)['name']} needs."
        }

    def _get_diy_solutions(self):
        """Get DIY solutions if applicable"""
        diy_tips = {
            'plumber': [
                'Try using a plunger for drain issues',
                'Check for visible leaks under sinks',
                'Ensure water shut-off valve is accessible',
                'Don\'t ignore small leaks - they can worsen'
            ],
            'electrician': [
                'Check circuit breaker first',
                'Don\'t touch wet electrical equipment',
                'Replace blown fuses if safe',
                'Turn off power before attempting any work'
            ],
            'carpenter': [
                'Document the damage with photos',
                'Don\'t apply temporary fixes that hide the problem',
                'Check if it affects structural integrity',
                'Assess if moisture is involved'
            ],
            'painter': [
                'Prepare surface properly before painting',
                'Use primer for better coverage',
                'Ensure proper ventilation',
                'Apply thin, even coats'
            ],
            'mechanic': [
                'Check oil and fluid levels regularly',
                'Don\'t ignore warning lights',
                'Keep maintenance records',
                'Address issues early'
            ],
            'cleaner': [
                'Regular maintenance prevents major cleanups',
                'Use appropriate cleaning products',
                'Ventilate during cleaning',
                'Address spills immediately'
            ],
            'handyman': [
                'Gather all necessary tools first',
                'Read instructions carefully',
                'Don\'t force anything',
                'Ask for help if unsure'
            ],
            'gardener': [
                'Water plants appropriately',
                'Remove dead plant material',
                'Maintain soil quality',
                'Regular pruning helps growth'
            ]
        }
        
        return diy_tips.get(self.service_category, [])

    def _assess_risk(self):
        """Assess safety risks"""
        critical_keywords = {
            'electrical': ['electric', 'shock', 'power', 'outlet', 'wire'],
            'water': ['flood', 'leak', 'water', 'wet', 'moisture'],
            'structural': ['crack', 'break', 'damage', 'collapse', 'safety'],
            'health': ['mold', 'pest', 'fume', 'toxic', 'chemical']
        }
        
        combined_text = f"{self.problem_description} {self.detailed_situation}".lower()
        risks = []
        
        for risk_type, keywords in critical_keywords.items():
            if any(keyword in combined_text for keyword in keywords):
                risks.append(risk_type)
        
        return risks if risks else ['none']

    def _professional_needed(self):
        """Determine if professional help is needed"""
        severity = self._assess_severity()
        risks = self._assess_risk()
        
        if severity == 'critical' or len(risks) > 0 or 'none' not in risks:
            return True
        
        return severity in ['high', 'medium']

    def get_recommendation(self):
        """Get provider recommendation"""
        self.current_stage = ConversationStage.RECOMMENDATION
        
        return {
            'stage': ConversationStage.RECOMMENDATION.value,
            'message': f"Based on our conversation, I recommend hiring a {ServiceCategory.get_category(self.service_category)['name']} to handle this properly.",
            'reasons': [
                'Ensures proper diagnosis and solutions',
                'Saves time and potential mistakes',
                'Professional warranty and guarantee',
                'Prevents further damage'
            ],
            'next_action': 'show_providers'
        }

    def get_provider_offer(self):
        """Get offer to hire a provider"""
        self.current_stage = ConversationStage.PROVIDER_OFFER
        
        return {
            'stage': ConversationStage.PROVIDER_OFFER.value,
            'message': f"Would you like to hire a {ServiceCategory.get_category(self.service_category)['name']} now?",
            'actions': [
                {
                    'type': 'search_providers',
                    'label': 'Search Available Providers',
                    'category': self.service_category
                },
                {
                    'type': 'book_service',
                    'label': 'Book a Service',
                    'category': self.service_category
                },
                {
                    'type': 'continue_chat',
                    'label': 'Ask More Questions'
                }
            ]
        }

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'user_id': self.user_id,
            'session_id': self.session_id,
            'current_stage': self.current_stage.value,
            'service_category': self.service_category,
            'problem_description': self.problem_description,
            'detailed_situation': self.detailed_situation,
            'created_at': self.created_at.isoformat()
        }
