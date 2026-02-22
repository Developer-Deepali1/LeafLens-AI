// ==================== LOCALIZATION SYSTEM ====================

class LocalizationManager {
    constructor() {
        this.currentLanguage = localStorage.getItem('selectedLanguage') || 'en';
        this.translations = {};
        this.languages = {};
        this.isLoading = false;
        
        console.log('🌐 Localization Manager initialized');
        console.log(`📍 Current language: ${this.currentLanguage}`);
    }
    
    // Initialize localization
    async initialize() {
        try {
            console.log('🔄 Initializing localization system...');
            
            // Load supported languages
            await this.loadLanguages();
            
            // Load translations for current language
            await this.loadTranslations(this.currentLanguage);
            
            // Apply translations to page
            this.applyTranslations();
            
            // Setup language selector
            this.setupLanguageSelector();
            
            console.log('✅ Localization system initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing localization system:', error);
        }
    }
    
    // Load supported languages
    async loadLanguages() {
        try {
            const response = await fetch('/api/languages');
            const languages = await response.json();
            this.languages = languages;
            console.log('🌐 Supported languages loaded:', Object.keys(this.languages));
        } catch (error) {
            console.error('❌ Error loading supported languages:', error);
        }
    }       
}