import bson
import os
import re
from collections import defaultdict

class MockCollection:
    def __init__(self, bson_file):
        self.bson_file = bson_file
        self.data = []
        if os.path.exists(bson_file):
            with open(bson_file, 'rb') as f:
                self.data = list(bson.decode_all(f.read()))
        else:
            print(f"[!] BSON file {bson_file} not found")
            # Add mock data for testing
            self.data = [
                {
                    "url": "http://example1.onion",
                    "title": "Sample Threat Intel 1",
                    "clean_text": "Sample text with IP 192.168.1.1 and domain example.com",
                    "nlp_processed": False
                },
                {
                    "url": "http://example2.onion",
                    "title": "Sample Threat Intel 2",
                    "clean_text": "Another sample with IP 172.16.0.1",
                    "nlp_processed": False
                }
            ]
            self.save()
        
        print("MockCollection initialized with documents:")
        for doc in self.data:
            print(f"Document: {doc['url']}")
            if doc.get('nlp_processed'):
                print(f"  IOCs: {doc.get('iocs', {})}")
                print(f"  Sentiment: {doc.get('sentiment', 'unknown')}")
                print(f"  Geolocation: {doc.get('geolocation', {})}")
            else:
                print("  No NLP processing data available")
    
    def save(self):
        """Save the current state of the collection back to the BSON file"""
        with open(self.bson_file, 'wb') as f:
            f.write(bson.encode(self.data))
    
    def find(self, query=None, projection=None):
        if query is None:
            query = {}
        results = []
        for doc in self.data:
            if self._matches(doc, query):
                results.append(self._project(doc, projection))
        return results

    def count_documents(self, query=None):
        return len(self.find(query))

    def aggregate(self, pipeline):
        if not pipeline:
            return []
            
        # Get the match stage
        match_stage = next((stage for stage in pipeline if '$match' in stage), {})
        matched_docs = self.find(match_stage.get('$match', {}))
        
        # Get the project stage
        project_stage = next((stage for stage in pipeline if '$project' in stage), {})
        project_fields = project_stage.get('$project', {})
        
        # Process project stage
        projected_docs = []
        for doc in matched_docs:
            projected_doc = {}
            for field, expr in project_fields.items():
                if isinstance(expr, dict):
                    if '$size' in expr:
                        # Handle $size operator
                        if '$ifNull' in expr['$size']:
                            array_path = expr['$size']['$ifNull'][0]
                            default_val = expr['$size']['$ifNull'][1]
                        else:
                            array_path = expr['$size']
                            default_val = []
                        array_val = self._get_nested_value(doc, array_path)
                        projected_doc[field] = len(array_val) if isinstance(array_val, list) else len(default_val)
                    else:
                        projected_doc[field] = self._get_nested_value(doc, expr)
                else:
                    projected_doc[field] = self._get_nested_value(doc, expr)
            projected_docs.append(projected_doc)
        
        # Get the group stage
        group_stage = next((stage for stage in pipeline if '$group' in stage), {})
        
        if group_stage:
            # Handle grouping
            group_id = group_stage['$group']['_id']
            accumulators = {k: v for k, v in group_stage['$group'].items() if k != '_id'}
            
            if group_id is None:
                # Single group aggregation
                result = {}
                for doc in projected_docs:
                    for field, expr in accumulators.items():
                        if '$sum' in expr:
                            if isinstance(expr['$sum'], str):
                                # Sum of a field
                                val = doc.get(expr['$sum'], 0)
                                result[field] = result.get(field, 0) + (val if isinstance(val, (int, float)) else 0)
                            else:
                                # Sum of a constant
                                result[field] = result.get(field, 0) + expr['$sum']
                return [result]
            
            # Group by field
            groups = defaultdict(lambda: {field: 0 for field in accumulators})
            for doc in projected_docs:
                group_key = doc.get(group_id)
                for field, expr in accumulators.items():
                    if '$sum' in expr:
                        if isinstance(expr['$sum'], str):
                            val = doc.get(expr['$sum'], 0)
                            groups[group_key][field] += val if isinstance(val, (int, float)) else 0
                        else:
                            groups[group_key][field] += expr['$sum']
            
            return [{'$group': {'_id': k, **v}} for k, v in groups.items()]
        
        # Handle sort and limit stages
        sort_stage = next((stage for stage in pipeline if '$sort' in stage), {})
        limit_stage = next((stage for stage in pipeline if '$limit' in stage), {})
        
        if sort_stage:
            sort_field = list(sort_stage['$sort'].keys())[0]
            sort_order = sort_stage['$sort'][sort_field]
            projected_docs.sort(
                key=lambda x: x.get(sort_field, 0),
                reverse=(sort_order == -1)
            )
        
        if limit_stage:
            projected_docs = projected_docs[:limit_stage['$limit']]
        
        return projected_docs
    
    def _matches(self, doc, query):
        if not query:
            return True
        for key, value in query.items():
            if '.' in key:
                # Handle nested fields
                parts = key.split('.')
                current = doc
                for part in parts[:-1]:
                    if not isinstance(current, dict):
                        return False
                    current = current.get(part)
                    if current is None:
                        return False
                if not isinstance(current, dict):
                    return False
                if parts[-1] not in current:
                    return False
                if isinstance(value, dict):
                    if '$exists' in value:
                        if value['$exists'] and parts[-1] not in current:
                            return False
                        if not value['$exists'] and parts[-1] in current:
                            return False
                elif current[parts[-1]] != value:
                    return False
            else:
                # Handle top-level fields
                if key not in doc:
                    return False
                if isinstance(value, dict):
                    if '$exists' in value:
                        if value['$exists'] and key not in doc:
                            return False
                        if not value['$exists'] and key in doc:
                            return False
                elif doc[key] != value:
                    return False
        return True
    
    def _project(self, doc, projection):
        if not projection:
            return doc.copy()
        result = {}
        for field in projection:
            if field == '_id':
                result['_id'] = doc.get('_id')
            else:
                result[field] = self._get_nested_value(doc, field)
        return result
    
    def _get_nested_value(self, doc, path):
        if not path:
            return doc
        if isinstance(path, (int, float)):
            return path
        parts = path.split('.')
        value = doc
        for part in parts:
            if isinstance(value, dict):
                value = value.get(part)
            elif isinstance(value, list):
                try:
                    value = value[int(part)]
                except (ValueError, IndexError):
                    return None
            else:
                return None
        return value
