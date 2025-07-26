'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Building2,
  Package
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Company {
  id: string;
  name: string;
  country: string | null;
  website: string | null;
  created_at: string;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCompanies();
  }, [searchTerm]);

        const fetchCompanies = async () => {
        try {
          setIsLoading(true);

          // Build query parameters
          const params = new URLSearchParams();
          params.append('type', 'companies');
          if (searchTerm) params.append('search', searchTerm);

          const response = await fetch(`/api/admin/data?${params.toString()}`);
          const result = await response.json();

          if (result.success) {
            setCompanies(result.companies || []);
          } else {
            console.error('Error fetching companies:', result.error);
            toast.error('Failed to load companies');
          }
        } catch (error) {
          console.error('Error fetching companies:', error);
          toast.error('Failed to load companies');
        } finally {
          setIsLoading(false);
        }
      };

  const handleDeleteCompany = async (companyId: string) => {
    if (!confirm('Are you sure you want to delete this company? Products from this company will be unassigned.')) return;

    try {
      const response = await fetch('/api/admin/mutations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          table: 'companies',
          id: companyId
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Company deleted successfully');
        fetchCompanies();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error('Failed to delete company');
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow h-24"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
          <p className="text-gray-600">Manage product companies</p>
        </div>
        <Link
          href="/admin/companies/new"
          className="bg-lime-600 text-white px-4 py-2 rounded-lg hover:bg-lime-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Company
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company) => (
          <div key={company.id} className="bg-white rounded-lg shadow overflow-hidden">
            {/* Company Logo */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-gray-400" />
              </div>
            </div>

            {/* Company Content */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-medium text-gray-900">
                  {company.name}
                </h3>
                {/* Removed is_active status as per new interface */}
              </div>
              
              {/* Removed description as per new interface */}

              {company.website && (
                <div className="mb-3">
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {company.website}
                  </a>
                </div>
              )}

              {/* Removed product_count as per new interface */}
              <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                <span>Created: {new Date(company.created_at).toLocaleDateString()}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                {/* Removed toggle status button as per new interface */}

                <div className="flex items-center space-x-2">
                  <Link
                    href={`/admin/companies/${company.id}`}
                    className="p-1 text-blue-600 hover:text-blue-900"
                    title="Edit Company"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDeleteCompany(company.id)}
                    className="p-1 text-red-600 hover:text-red-900"
                    title="Delete Company"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {companies.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm
              ? 'Try adjusting your search'
              : 'Get started by adding your first company'
            }
          </p>
          <Link
            href="/admin/companies/new"
            className="bg-lime-600 text-white px-4 py-2 rounded-lg hover:bg-lime-700 transition-colors"
          >
            Add Company
          </Link>
        </div>
      )}

      {/* Summary */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Total Companies:</span> {companies.length}
          </div>
          {/* Removed Active count as per new interface */}
          {/* Removed Total Products count as per new interface */}
        </div>
      </div>
    </div>
  );
} 