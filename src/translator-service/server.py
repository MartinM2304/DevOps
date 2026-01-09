#!/usr/bin/env python3
"""
RPC Translation Service for Requirements Management System
Uses XML-RPC to receive Requirement objects and translate them
"""

from xmlrpc.server import SimpleXMLRPCServer
from xmlrpc.server import SimpleXMLRPCServer
import logging
from deep_translator import GoogleTranslator
from typing import Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TranslationService:
    """RPC Service for translating requirement fields"""
    
    def __init__(self):
        self.translator = None
    
    def translate_requirement(self, requirement: Dict[str, Any], target_lang: str = 'en') -> Dict[str, Any]:
        """
        Translate a requirement object to target language
        
        Args:
            requirement: Dictionary containing requirement fields
            target_lang: Target language code (default: 'en')
        
        Returns:
            Translated requirement dictionary
        """
        try:
            logger.info(f"Translating requirement to {target_lang}")
            
            # Initialize translator
            translator = GoogleTranslator(source='auto', target=target_lang)
            
            # Translate main fields
            translated = requirement.copy()
            
            # Translate title
            if 'title' in requirement and requirement['title']:
                translated['title'] = translator.translate(requirement['title'])
            
            # Translate description
            if 'description' in requirement and requirement['description']:
                translated['description'] = translator.translate(requirement['description'])
            
            # Translate component if present
            if 'component' in requirement and requirement['component']:
                translated['component'] = translator.translate(requirement['component'])
            
            # Translate assignee if present
            if 'assignee' in requirement and requirement['assignee']:
                translated['assignee'] = translator.translate(requirement['assignee'])
            
            # Translate indicators descriptions
            if 'indicators' in requirement and isinstance(requirement['indicators'], list):
                translated['indicators'] = []
                for indicator in requirement['indicators']:
                    translated_indicator = indicator.copy()
                    if 'name' in indicator:
                        translated_indicator['name'] = translator.translate(indicator['name'])
                    if 'description' in indicator:
                        translated_indicator['description'] = translator.translate(indicator['description'])
                    translated['indicators'].append(translated_indicator)
            
            # Translate tags if present (array)
            if 'tags' in requirement and isinstance(requirement['tags'], list):
                translated['tags'] = [translator.translate(tag) for tag in requirement['tags']]
            elif 'tags' in requirement and requirement['tags']:
                # Handle JSON string tags
                import json
                try:
                    tags = json.loads(requirement['tags']) if isinstance(requirement['tags'], str) else requirement['tags']
                    translated['tags'] = [translator.translate(tag) for tag in tags]
                except:
                    translated['tags'] = requirement['tags']
            
            logger.info("Translation completed successfully")
            return {
                'status': 'ok',
                'requirement': translated,
                'target_language': target_lang
            }
            
        except Exception as e:
            logger.error(f"Translation error: {str(e)}")
            return {
                'status': 'error',
                'message': str(e)
            }
    
    def translate_text(self, text: str, target_lang: str = 'en', source_lang: str = 'auto') -> Dict[str, Any]:
        """
        Simple text translation
        
        Args:
            text: Text to translate
            target_lang: Target language code
            source_lang: Source language code (default: 'auto')
        
        Returns:
            Dictionary with translated text
        """
        try:
            translator = GoogleTranslator(source=source_lang, target=target_lang)
            translated = translator.translate(text)
            return {
                'status': 'ok',
                'original': text,
                'translated': translated,
                'target_language': target_lang
            }
        except Exception as e:
            logger.error(f"Translation error: {str(e)}")
            return {
                'status': 'error',
                'message': str(e)
            }
    
    def get_supported_languages(self) -> Dict[str, Any]:
        """Get list of supported languages"""
        try:
            languages = GoogleTranslator.get_supported_languages()
            return {
                'status': 'ok',
                'languages': languages
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': str(e)
            }

def main():
    """Start the RPC server"""
    server = SimpleXMLRPCServer(('0.0.0.0', 8001), allow_none=True)
    server.register_introspection_functions()
    
    service = TranslationService()
    server.register_instance(service)
    
    logger.info("Translation RPC Server starting on port 8001...")
    logger.info("Available methods:")
    logger.info("  - translate_requirement(requirement_dict, target_lang='en')")
    logger.info("  - translate_text(text, target_lang='en', source_lang='auto')")
    logger.info("  - get_supported_languages()")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Shutting down server...")
        server.server_close()

if __name__ == '__main__':
    main()