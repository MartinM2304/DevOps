<?php

class TranslatorRPC {
    private $client;
    private $host;
    private $port;
    
    public function __construct($host = 'translator-service', $port = 8001) {
        $this->host = $host;
        $this->port = $port;
        $this->client = null;
    }
    
    private function getClient() {
        if ($this->client === null) {
            $url = "http://{$this->host}:{$this->port}";
            $this->client = new SoapClient(null, [
                'location' => $url,
                'uri' => $url,
                'style' => SOAP_RPC,
                'use' => SOAP_ENCODED
            ]);
        }
        return $this->client;
    }
    
    public function translateRequirement($requirement, $targetLang = 'en') {
        try {
            $url = "http://{$this->host}:{$this->port}";
            
            // Use XML-RPC via HTTP POST
            $request = xmlrpc_encode_request('translate_requirement', [
                $requirement,
                $targetLang
            ]);
            
            $context = stream_context_create([
                'http' => [
                    'method' => 'POST',
                    'header' => 'Content-Type: text/xml',
                    'content' => $request
                ]
            ]);
            
            $response = file_get_contents($url, false, $context);
            $result = xmlrpc_decode($response);
            
            if (xmlrpc_is_fault($result)) {
                error_log("RPC Error: " . $result['faultString']);
                return ['status' => 'error', 'message' => $result['faultString']];
            }
            
            return $result;
        } catch (Exception $e) {
            error_log("Translation RPC Error: " . $e->getMessage());
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }
    
    public function translateText($text, $targetLang = 'en', $sourceLang = 'auto') {
        try {
            $url = "http://{$this->host}:{$this->port}";
            
            $request = xmlrpc_encode_request('translate_text', [
                $text,
                $targetLang,
                $sourceLang
            ]);
            
            $context = stream_context_create([
                'http' => [
                    'method' => 'POST',
                    'header' => 'Content-Type: text/xml',
                    'content' => $request
                ]
            ]);
            
            $response = file_get_contents($url, false, $context);
            $result = xmlrpc_decode($response);
            
            if (xmlrpc_is_fault($result)) {
                return ['status' => 'error', 'message' => $result['faultString']];
            }
            
            return $result;
        } catch (Exception $e) {
            error_log("Translation RPC Error: " . $e->getMessage());
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }
   
    public function getSupportedLanguages() {
        try {
            $url = "http://{$this->host}:{$this->port}";
            
            $request = xmlrpc_encode_request('get_supported_languages', []);
            
            $context = stream_context_create([
                'http' => [
                    'method' => 'POST',
                    'header' => 'Content-Type: text/xml',
                    'content' => $request
                ]
            ]);
            
            $response = file_get_contents($url, false, $context);
            $result = xmlrpc_decode($response);
            
            if (xmlrpc_is_fault($result)) {
                return ['status' => 'error', 'message' => $result['faultString']];
            }
            
            return $result;
        } catch (Exception $e) {
            error_log("Translation RPC Error: " . $e->getMessage());
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }
}