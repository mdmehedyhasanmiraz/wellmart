'use client';

import { useState, useEffect } from 'react';

interface SchemaInfo {
  tables: any;
  products_schema: string[] | null;
  manufacturers_table: any;
  companies_table: any;
  errors: string[];
}

export default function DebugSchemaPage() {
  const [schemaInfo, setSchemaInfo] = useState<SchemaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSchema = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/debug-schema');
        const result = await response.json();

        if (result.success) {
          setSchemaInfo(result.schema_info);
        } else {
          setError(result.error);
        }
      } catch (error) {
        setError('Failed to check schema');
        console.error('Schema check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSchema();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking database schema...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Database Schema Debug</h1>
        
        {schemaInfo && (
          <div className="space-y-6">
            {/* Products Schema */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Products Table Schema</h2>
              {schemaInfo.products_schema ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {schemaInfo.products_schema.map((field, index) => (
                    <div key={index} className="bg-gray-100 px-3 py-2 rounded text-sm font-mono">
                      {field}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No schema information available</p>
              )}
            </div>

            {/* Manufacturers Table */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Manufacturers Table</h2>
              {schemaInfo.manufacturers_table?.exists ? (
                <div>
                  <p className="text-green-600 mb-2">✅ Table exists</p>
                  {schemaInfo.manufacturers_table.sample_data && (
                    <div className="bg-gray-100 p-4 rounded">
                      <h3 className="font-semibold mb-2">Sample Data:</h3>
                      <pre className="text-sm overflow-x-auto">
                        {JSON.stringify(schemaInfo.manufacturers_table.sample_data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-red-600 mb-2">❌ Table does not exist</p>
                  {schemaInfo.manufacturers_table?.error && (
                    <p className="text-gray-600 text-sm">Error: {schemaInfo.manufacturers_table.error}</p>
                  )}
                </div>
              )}
            </div>

            {/* Companies Table */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Companies Table</h2>
              {schemaInfo.companies_table?.exists ? (
                <div>
                  <p className="text-green-600 mb-2">✅ Table exists</p>
                  {schemaInfo.companies_table.sample_data && (
                    <div className="bg-gray-100 p-4 rounded">
                      <h3 className="font-semibold mb-2">Sample Data:</h3>
                      <pre className="text-sm overflow-x-auto">
                        {JSON.stringify(schemaInfo.companies_table.sample_data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-red-600 mb-2">❌ Table does not exist</p>
                  {schemaInfo.companies_table?.error && (
                    <p className="text-gray-600 text-sm">Error: {schemaInfo.companies_table.error}</p>
                  )}
                </div>
              )}
            </div>

            {/* Query Test Results */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Query Test Results</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-green-600 mb-2">Products with Manufacturers Query:</h3>
                  {schemaInfo.tables.products_with_manufacturers ? (
                    <div className="bg-green-50 p-4 rounded">
                      <p className="text-green-700 mb-2">✅ Query successful</p>
                      <pre className="text-sm overflow-x-auto">
                        {JSON.stringify(schemaInfo.tables.products_with_manufacturers, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-red-600">❌ Query failed</p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-blue-600 mb-2">Products with Companies Query:</h3>
                  {schemaInfo.tables.products_with_companies ? (
                    <div className="bg-blue-50 p-4 rounded">
                      <p className="text-blue-700 mb-2">✅ Query successful</p>
                      <pre className="text-sm overflow-x-auto">
                        {JSON.stringify(schemaInfo.tables.products_with_companies, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-red-600">❌ Query failed</p>
                  )}
                </div>
              </div>
            </div>

            {/* Errors */}
            {schemaInfo.errors.length > 0 && (
              <div className="bg-red-50 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-red-800 mb-4">Errors Found</h2>
                <div className="space-y-2">
                  {schemaInfo.errors.map((error, index) => (
                    <div key={index} className="bg-red-100 p-3 rounded text-red-700 text-sm">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 