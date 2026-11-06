'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import UnpppsConfig from '../../data/UnpppsConfig.json';

interface Workflow {
  id: number;
  name: string;
  state: string;
  health: string;
}

const HEALTH_ORDER: Record<string, number> = { nah: 0, meh: 1, yah: 2 };

const healthBadge = (health: string) => {
  if (health === 'yah') return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
  if (health === 'nah') return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
  return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-500';
};

const UnpppWorkflowDisplay: React.FC<{ unpppId?: string }> = ({ unpppId }) => {
  const pathname = usePathname();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasWorkflowFile, setHasWorkflowFile] = useState(false);
  
  // Resolve UNPPP from explicit prop, falling back to the current path
  const currentUnppp = UnpppsConfig.unppps.find((unppp: { id: string; name: string }) => {
    if (unpppId) return unppp.id === unpppId;
    const unpppPath = unppp.id === 'theunpartyapp' ? '/' : `/${unppp.id}`;
    return pathname === unpppPath;
  });
  
  useEffect(() => {
    const loadWorkflows = async () => {
      if (!currentUnppp) {
        setLoading(false);
        return;
      }

      try {
        // Try to dynamically import the workflow file for this unppp
        const workflowData = { default: [] as Workflow[] };
        const raw: Workflow[] = workflowData.default || [];
        setWorkflows([...raw].sort((a, b) =>
          (HEALTH_ORDER[a.health] ?? 1) - (HEALTH_ORDER[b.health] ?? 1)
        ));
        setHasWorkflowFile(true);
      } catch {
        // No workflow file exists for this unppp
        setWorkflows([]);
        setHasWorkflowFile(false);
      } finally {
        setLoading(false);
      }
    };

    loadWorkflows();
  }, [currentUnppp]);
  
  // Don't render if not on an UNPPP page
  if (!currentUnppp) {
    return null;
  }

  if (loading) {
    return (
      <div className="w-full py-4">
        <span className="font-google-sans-code text-sm" style={{ color: 'var(--text-muted)' }}>
          thinking...
        </span>
      </div>
    );
  }

  if (!hasWorkflowFile || workflows.length === 0) {
    return (
      <div className="w-full py-4">
        <span className="font-google-sans-code text-sm" style={{ color: 'var(--text-muted)' }}>
          👾 oh no, nothing here. unparty-app is MEH!
        </span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200/20 dark:border-gray-700/20">
              <th className="py-3 pl-0 pr-4 text-left">
                <span className="font-google-sans-code text-xs uppercase tracking-wide" 
                      style={{ color: 'var(--text-muted)' }}>
                  WORKFLOW.
                </span>
              </th>
              <th className="py-3 px-4 text-left">
                <span className="font-google-sans-code text-xs uppercase tracking-wide" 
                      style={{ color: 'var(--text-muted)' }}>
                  STATE.
                </span>
              </th>
               <th className="py-3 px-4 text-left">
                <span className="font-google-sans-code text-xs uppercase tracking-wide" 
                      style={{ color: 'var(--text-muted)' }}>
                  HEALTH.
                </span>
              </th>
              <th className="py-3 px-4 text-left">
                <span className="font-google-sans-code text-xs uppercase tracking-wide" 
                      style={{ color: 'var(--text-muted)' }}>
                  ID.
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {workflows.map((workflow) => (
              <tr 
                key={workflow.id}
                className="border-b border-gray-200/10 dark:border-gray-700/10 transition-colors duration-200 hover:bg-gray-50/20 dark:hover:bg-white/5"
              >
                {/* Workflow Name */}
                <td className="py-3 pl-0 pr-4">
                  <span className="font-google-sans-code uppercase text-sm" 
                        style={{ color: 'var(--foreground)' }}>
                    {workflow.name}
                  </span>
                </td>
                
                {/* State with badge */}
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center rounded-full px-2 py-1 font-vt323 text-xs uppercase tracking-wide ${
                    workflow.state === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                  }`}>
                    {workflow.state}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center rounded-full px-2 py-1 font-vt323 text-xs uppercase tracking-wide ${healthBadge(workflow.health)}`}>
                    {workflow.health}
                  </span>
                </td>
                
                {/* Workflow ID */}
                <td className="py-3 px-4">
                  <span className="font-vt323 text-xs" 
                        style={{ color: 'var(--text-muted)' }}>
                    {workflow.id}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Workflow count footer */}
      <div className="mt-4 flex items-center justify-between">
        <span className="font-vt323 text-xs" style={{ color: 'var(--text-muted)' }}>
          {workflows.length} workflow{workflows.length !== 1 ? 's' : ''}
        </span>
        <span className="font-vt323 text-xs flex gap-3">
          {workflows.some(w => w.health === 'nah') && (
            <span className="text-red-500 dark:text-red-400">
              {workflows.filter(w => w.health === 'nah').length} nah
            </span>
          )}
          {workflows.some(w => w.health === 'meh') && (
            <span style={{ color: 'var(--text-muted)' }}>
              {workflows.filter(w => w.health === 'meh').length} meh
            </span>
          )}
          {workflows.some(w => w.health === 'yah') && (
            <span className="text-green-600 dark:text-green-400">
              {workflows.filter(w => w.health === 'yah').length} yah
            </span>
          )}
        </span>
      </div>
    </div>
  );
};

export default UnpppWorkflowDisplay;
