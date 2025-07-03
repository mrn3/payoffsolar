'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  FaFacebookMessenger, 
  FaEnvelope, 
  FaSms, 
  FaArrowUp, 
  FaArrowDown,
  FaSpinner,
  FaExclamationTriangle
} from 'react-icons/fa';
import { CommunicationHistoryItem } from '@/lib/models';

interface CommunicationHistoryProps {
  contactId: string;
}

interface CommunicationResponse {
  communications: CommunicationHistoryItem[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export default function CommunicationHistory({ contactId }: CommunicationHistoryProps) {
  const [communications, setCommunications] = useState<CommunicationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false
  });

  const fetchCommunications = async (offset = 0, append = false) => {
    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      const response = await fetch(
        `/api/contacts/${contactId}/communications?limit=${pagination.limit}&offset=${offset}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch communication history');
      }

      const data: CommunicationResponse = await response.json();
      
      if (append) {
        setCommunications(prev => [...prev, ...data.communications]);
      } else {
        setCommunications(data.communications);
      }
      
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      console.error('Error fetching communications:', err);
      setError(err instanceof Error ? err.message : 'Failed to load communications');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchCommunications();
  }, [contactId]);

  const loadMore = () => {
    if (pagination.hasMore && !loadingMore) {
      fetchCommunications(pagination.offset + pagination.limit, true);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'facebook':
        return <FaFacebookMessenger className="h-4 w-4 text-blue-600" />;
      case 'email':
        return <FaEnvelope className="h-4 w-4 text-gray-600" />;
      case 'sms':
        return <FaSms className="h-4 w-4 text-green-600" />;
      default:
        return <FaEnvelope className="h-4 w-4 text-gray-600" />;
    }
  };

  const getDirectionIcon = (direction: string) => {
    return direction === 'inbound' ? (
      <FaArrowDown className="h-3 w-3 text-blue-500" title="Received" />
    ) : (
      <FaArrowUp className="h-3 w-3 text-green-500" title="Sent" />
    );
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'facebook':
        return 'Facebook Messenger';
      case 'email':
        return 'Email';
      case 'sms':
        return 'SMS';
      default:
        return 'Message';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'MMM d, yyyy h:mm a');
    } catch {
      return 'Invalid date';
    }
  };

  const truncateContent = (content: string, maxLength = 150) => {
    if (!content) return '';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const statusColors: Record<string, string> = {
      sent: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      bounced: 'bg-red-100 text-red-800',
      opened: 'bg-purple-100 text-purple-800',
      clicked: 'bg-indigo-100 text-indigo-800',
      undelivered: 'bg-yellow-100 text-yellow-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Communication History</h2>
        </div>
        <div className="p-6 text-center">
          <FaSpinner className="animate-spin h-8 w-8 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Loading communication history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Communication History</h2>
        </div>
        <div className="p-6 text-center">
          <FaExclamationTriangle className="h-8 w-8 text-red-400 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => fetchCommunications()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">
          Communication History ({pagination.total})
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          All messages, emails, and texts with this contact
        </p>
      </div>
      
      <div className="divide-y divide-gray-200">
        {communications.length === 0 ? (
          <div className="p-6 text-center">
            <FaEnvelope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No communication history found</p>
            <p className="text-sm text-gray-400 mt-2">
              Messages, emails, and texts will appear here once you start communicating with this contact.
            </p>
          </div>
        ) : (
          <>
            {communications.map((comm) => (
              <div key={`${comm.type}-${comm.id}`} className="p-6 hover:bg-gray-50">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 flex items-center space-x-2">
                    {getTypeIcon(comm.type)}
                    {getDirectionIcon(comm.direction)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-900">
                          {getTypeLabel(comm.type)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {comm.direction === 'inbound' ? 'Received' : 'Sent'}
                        </span>
                        {comm.status && getStatusBadge(comm.status)}
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatTimestamp(comm.timestamp)}
                      </span>
                    </div>
                    
                    {comm.subject && (
                      <h4 className="text-sm font-medium text-gray-900 mb-1">
                        {comm.subject}
                      </h4>
                    )}
                    
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {truncateContent(comm.content || '')}
                    </p>
                    
                    {comm.metadata && comm.type === 'email' && comm.metadata.from_email && (
                      <div className="mt-2 text-xs text-gray-500">
                        From: {comm.metadata.from_email} → To: {comm.metadata.to_email}
                      </div>
                    )}
                    
                    {comm.metadata && comm.type === 'sms' && comm.metadata.from_phone && (
                      <div className="mt-2 text-xs text-gray-500">
                        {comm.metadata.from_phone} → {comm.metadata.to_phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {pagination.hasMore && (
              <div className="p-6 text-center border-t border-gray-200">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {loadingMore ? (
                    <>
                      <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
