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

    private function isNumericArray($arr): bool {
        if (!is_array($arr)) return false;
        return array_keys($arr) === range(0, count($arr) - 1);
    }

    private function xmlrpcEncodeScalar($value): string {
        if (is_bool($value)) {
            return '<boolean>' . ($value ? '1' : '0') . '</boolean>';
        }
        if (is_int($value)) {
            return '<int>' . $value . '</int>';
        }
        if (is_float($value)) {
            return '<double>' . $value . '</double>';
        }
        // Fallback to string; nulls become empty strings
        $str = $value === null ? '' : (string)$value;
        return '<string>' . htmlspecialchars($str, ENT_QUOTES | ENT_XML1, 'UTF-8') . '</string>';
    }

    private function xmlrpcEncodeValue($value): string {
        if (is_array($value)) {
            if ($this->isNumericArray($value)) {
                $items = '';
                foreach ($value as $v) {
                    $items .= '<value>' . $this->xmlrpcEncodeValue($v) . '</value>';
                }
                return '<array><data>' . $items . '</data></array>';
            } else {
                $members = '';
                foreach ($value as $k => $v) {
                    $members .= '<member><name>' . htmlspecialchars((string)$k, ENT_QUOTES | ENT_XML1, 'UTF-8') . '</name><value>' . $this->xmlrpcEncodeValue($v) . '</value></member>';
                }
                return '<struct>' . $members . '</struct>';
            }
        }
        return $this->xmlrpcEncodeScalar($value);
    }

    private function xmlrpcBuildRequest(string $method, array $params = []): string {
        $xml = '<?xml version="1.0"?>';
        $xml .= '<methodCall><methodName>' . htmlspecialchars($method, ENT_QUOTES | ENT_XML1, 'UTF-8') . '</methodName><params>';
        foreach ($params as $p) {
            $xml .= '<param><value>' . $this->xmlrpcEncodeValue($p) . '</value></param>';
        }
        $xml .= '</params></methodCall>';
        return $xml;
    }

    private function xmlrpcDecodeValue($valueNode) {
        if (!$valueNode) return null;
        // $valueNode is <value> ...
        $children = $valueNode->children();
        if (count($children) === 0) {
            return '';
        }
        $typeNode = $children[0];
        $type = $typeNode->getName();
        switch ($type) {
            case 'boolean':
                return ((string)$typeNode) === '1';
            case 'int':
            case 'i4':
                return (int)$typeNode;
            case 'double':
                return (float)$typeNode;
            case 'string':
                return (string)$typeNode;
            case 'struct':
                $result = [];
                foreach ($typeNode->member as $member) {
                    $name = (string)$member->name;
                    $result[$name] = $this->xmlrpcDecodeValue($member->value);
                }
                return $result;
            case 'array':
                $arr = [];
                if (isset($typeNode->data)) {
                    foreach ($typeNode->data->value as $val) {
                        $arr[] = $this->xmlrpcDecodeValue($val);
                    }
                }
                return $arr;
            default:
                // Fallback to string contents
                return (string)$typeNode;
        }
    }
    
    public function translateRequirement($requirement, $targetLang = 'en') {
        try {
            $endpoint = "http://{$this->host}:{$this->port}/RPC2";
            
            // Build XML-RPC request manually
            $request = $this->xmlrpcBuildRequest('translate_requirement', [$requirement, $targetLang]);
            
            $context = stream_context_create([
                'http' => [
                    'method' => 'POST',
                    'header' => 'Content-Type: text/xml',
                    'content' => $request
                ]
            ]);
            
            $response = @file_get_contents($endpoint, false, $context);
            if ($response === false) {
                $err = error_get_last();
                error_log("Translation RPC request failed: " . ($err['message'] ?? 'unknown error'));
                return ['status' => 'error', 'message' => 'Translator service unreachable'];
            }

            $xml = @simplexml_load_string($response);
            if ($xml === false) {
                error_log("Translation RPC decode failed or invalid XML");
                return ['status' => 'error', 'message' => 'Invalid response from translator service'];
            }
            // Navigate to methodResponse -> params -> param -> value
            if (!isset($xml->params->param->value)) {
                return ['status' => 'error', 'message' => 'Malformed translator response'];
            }
            $decoded = $this->xmlrpcDecodeValue($xml->params->param->value);
            return is_array($decoded) ? $decoded : ['status' => 'error', 'message' => 'Unexpected translator response'];
        } catch (Exception $e) {
            error_log("Translation RPC Error: " . $e->getMessage());
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }
    
    public function translateText($text, $targetLang = 'en', $sourceLang = 'auto') {
        try {
            $endpoint = "http://{$this->host}:{$this->port}/RPC2";
            
            $request = $this->xmlrpcBuildRequest('translate_text', [$text, $targetLang, $sourceLang]);
            
            $context = stream_context_create([
                'http' => [
                    'method' => 'POST',
                    'header' => 'Content-Type: text/xml',
                    'content' => $request
                ]
            ]);
            
            $response = @file_get_contents($endpoint, false, $context);
            if ($response === false) {
                $err = error_get_last();
                error_log("Translation RPC request failed: " . ($err['message'] ?? 'unknown error'));
                return ['status' => 'error', 'message' => 'Translator service unreachable'];
            }

            $xml = @simplexml_load_string($response);
            if ($xml === false || !isset($xml->params->param->value)) {
                return ['status' => 'error', 'message' => 'Invalid response from translator service'];
            }
            $decoded = $this->xmlrpcDecodeValue($xml->params->param->value);
            return is_array($decoded) ? $decoded : ['status' => 'error', 'message' => 'Unexpected translator response'];
        } catch (Exception $e) {
            error_log("Translation RPC Error: " . $e->getMessage());
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }
   
    public function getSupportedLanguages() {
        try {
            $endpoint = "http://{$this->host}:{$this->port}/RPC2";
            
            $request = $this->xmlrpcBuildRequest('get_supported_languages', []);
            
            $context = stream_context_create([
                'http' => [
                    'method' => 'POST',
                    'header' => 'Content-Type: text/xml',
                    'content' => $request
                ]
            ]);
            
            $response = @file_get_contents($endpoint, false, $context);
            if ($response === false) {
                $err = error_get_last();
                error_log("Translation RPC request failed: " . ($err['message'] ?? 'unknown error'));
                return ['status' => 'error', 'message' => 'Translator service unreachable'];
            }

            $xml = @simplexml_load_string($response);
            if ($xml === false || !isset($xml->params->param->value)) {
                return ['status' => 'error', 'message' => 'Invalid response from translator service'];
            }
            $decoded = $this->xmlrpcDecodeValue($xml->params->param->value);
            return is_array($decoded) ? $decoded : ['status' => 'error', 'message' => 'Unexpected translator response'];
        } catch (Exception $e) {
            error_log("Translation RPC Error: " . $e->getMessage());
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }
}