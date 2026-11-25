import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { DataTable } from '../components/common/DataTable';
import { SearchBar } from '../components/common/SearchBar';
import { StatusBadge } from '../components/common/StatusBadge';
import { InventoryFormModal } from '../components/inventory/InventoryFormModal';
import { BloodUnitMovementModal } from '../components/inventory/BloodUnitMovementModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Modal } from '../components/common/Modal';
import { formatDate } from '../utils/formatters';
import { BLOOD_GROUPS, BLOOD_COMPONENTS } from '../utils/constants';
import {
  Boxes,
  SlidersHorizontal,
  Plus,
  Trash2,
  Edit,
  RefreshCw,
  History,
  ShieldCheck,
  AlertTriangle,
  Info
} from 'lucide-react';

export const InventoryPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'units';

  // --- Blood Units State ---
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedComponent, setSelectedComponent] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [historyUnit, setHistoryUnit] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // --- Stock Thresholds State ---
  const [thresholds, setThresholds] = useState([]);
  const [loadingThresholds, setLoadingThresholds] = useState(false);
  const [editingThreshold, setEditingThreshold] = useState(null);
  const [minStock, setMinStock] = useState(10);
  const [critStock, setCritStock] = useState(5);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedGroup) params.bloodGroup = selectedGroup;
      if (selectedComponent) params.component = selectedComponent;
      if (selectedStatus) params.status = selectedStatus;
      if (search) params.search = search;

      const { data } = await api.get('/inventory', { params });
      if (data.success) {
        setInventory(data.inventory);
      }
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchThresholds = async () => {
    try {
      setLoadingThresholds(true);
      const { data } = await api.get('/thresholds');
      if (data.success) {
        setThresholds(data.thresholds || []);
      }
    } catch (err) {
      console.error('Failed to fetch thresholds:', err);
    } finally {
      setLoadingThresholds(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'thresholds') {
      fetchThresholds();
    } else {
      fetchInventory();
    }
  }, [activeTab, selectedGroup, selectedComponent, selectedStatus, search]);

  const handleSaveUnit = async (formData) => {
    try {
      if (editingUnit) {
        await api.put(`/inventory/${editingUnit._id}`, formData);
      } else {
        await api.post('/inventory', formData);
      }
      fetchInventory();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving blood unit');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/inventory/${deleteId}`);
      fetchInventory();
    } catch (err) {
      alert('Failed to delete blood unit');
    }
  };

  const handleOpenThresholdModal = (item) => {
    setEditingThreshold(item);
    setMinStock(item.minimumStock);
    setCritStock(item.criticalStock);
  };

  const handleSaveThreshold = async (e) => {
    e.preventDefault();
    if (Number(critStock) > Number(minStock)) {
      alert('Critical stock cannot exceed minimum stock threshold.');
      return;
    }
    try {
      await api.put(`/thresholds/${editingThreshold._id}`, {
        minimumStock: Number(minStock),
        criticalStock: Number(critStock)
      });
      setEditingThreshold(null);
      fetchThresholds();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating threshold');
    }
  };

  const columns = [
    {
      header: 'Unit ID',
      key: 'unitId',
      render: (row) => (
        <span className="font-bold text-slate-800 font-mono text-xs">{row.unitId}</span>
      )
    },
    {
      header: 'Blood Group',
      key: 'bloodGroup',
      render: (row) => (
        <span className="font-extrabold text-blood-600">{row.bloodGroup}</span>
      )
    },
    { header: 'Component', key: 'component' },
    {
      header: 'Qty',
      key: 'quantity',
      render: (row) => <span className="font-bold">{row.quantity}</span>
    },
    {
      header: 'Collection Date',
      key: 'collectionDate',
      render: (row) => formatDate(row.collectionDate)
    },
    {
      header: 'Expiry Date',
      key: 'expiryDate',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-800">{formatDate(row.expiryDate)}</p>
          <span className="text-[10px] text-slate-400 font-bold">{row.daysRemaining}d remaining</span>
        </div>
      )
    },
    { header: 'Storage Location', key: 'storageLocation' },
    {
      header: 'Status',
      key: 'status',
      render: (row) => <StatusBadge type="inventory" status={row.status} />
    },
    {
      header: 'Actions',
      key: 'actions',
      sortable: false,
      render: (row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setHistoryUnit(row)}
            className="p-1 text-slate-500 hover:text-purple-600 hover:bg-slate-100 rounded"
            title="View Movement Audit Log"
          >
            <History className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setEditingUnit(row);
              setModalOpen(true);
            }}
            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded"
            title="Edit Unit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteId(row._id)}
            className="p-1 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded"
            title="Delete Unit"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Blood Inventory & Stock Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Physical blood units tracking, movement audit logs, and safety stock threshold settings
          </p>
        </div>

        {activeTab === 'units' && (
          <button
            onClick={() => {
              setEditingUnit(null);
              setModalOpen(true);
            }}
            className="px-4 py-2.5 bg-blood-600 hover:bg-blood-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Blood Unit</span>
          </button>
        )}
      </div>

      {/* Unified Tab Switcher */}
      <div className="flex items-center space-x-2 bg-white p-1.5 rounded-2xl border border-slate-200 w-fit">
        <button
          onClick={() => setSearchParams({ tab: 'units' })}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'units'
              ? 'bg-blood-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Blood Units Directory</span>
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'thresholds' })}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'thresholds'
              ? 'bg-blood-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Safety Stock Thresholds Settings</span>
        </button>
      </div>

      {/* TAB 1: Blood Units Directory */}
      {activeTab === 'units' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap gap-4 items-center justify-between">
            <SearchBar value={search} onChange={setSearch} placeholder="Search Unit ID or Storage..." />

            <div className="flex flex-wrap gap-3">
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white"
              >
                <option value="">All Blood Groups</option>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>

              <select
                value={selectedComponent}
                onChange={(e) => setSelectedComponent(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white"
              >
                <option value="">All Components</option>
                {BLOOD_COMPONENTS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white"
              >
                <option value="">All Statuses</option>
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="RESERVED">RESERVED</option>
                <option value="ISSUED">ISSUED</option>
                <option value="EXPIRED">EXPIRED</option>
              </select>

              <button
                onClick={fetchInventory}
                className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                title="Refresh Inventory"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner text="Fetching inventory records..." />
          ) : (
            <DataTable
              columns={columns}
              data={inventory}
              itemsPerPage={10}
              emptyTitle="No inventory units found"
              emptyDescription="Try adjusting your filters or add a new blood unit."
            />
          )}
        </div>
      )}

      {/* TAB 2: Safety Stock Thresholds Settings */}
      {activeTab === 'thresholds' && (
        <div className="space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start space-x-3 text-slate-700">
            <Info className="w-5 h-5 text-blood-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-slate-900">Safety Stock Threshold Configuration:</p>
              <p className="text-slate-600 leading-relaxed">
                Configure minimum buffer and critical emergency levels for each blood group and component.
                When physical inventory falls below minimum levels, automated <strong>LOW_STOCK</strong> warnings are generated to initiate replacement drives.
              </p>
            </div>
          </div>

          {loadingThresholds ? (
            <LoadingSpinner text="Fetching threshold configurations..." />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Blood Group</th>
                      <th className="px-6 py-4">Component</th>
                      <th className="px-6 py-4">Minimum Threshold</th>
                      <th className="px-6 py-4">Critical Threshold</th>
                      <th className="px-6 py-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {thresholds.map((t) => (
                      <tr key={t._id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-black text-blood-600 text-sm">{t.bloodGroup}</td>
                        <td className="px-6 py-4">{t.component}</td>
                        <td className="px-6 py-4 font-bold text-slate-700">{t.minimumStock} units</td>
                        <td className="px-6 py-4 font-bold text-red-600">{t.criticalStock} units</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleOpenThresholdModal(t)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center space-x-1 transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit Threshold</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {modalOpen && (
        <InventoryFormModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSaveUnit}
          initialData={editingUnit}
        />
      )}

      {historyUnit && (
        <BloodUnitMovementModal
          isOpen={!!historyUnit}
          onClose={() => setHistoryUnit(null)}
          unit={historyUnit}
        />
      )}

      {deleteId && (
        <ConfirmDialog
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
          title="Delete Blood Unit"
          message="Are you sure you want to delete this blood unit from physical inventory? This action cannot be undone."
          confirmText="Delete Unit"
        />
      )}

      {editingThreshold && (
        <Modal
          isOpen={!!editingThreshold}
          onClose={() => setEditingThreshold(null)}
          title={`Configure Threshold: ${editingThreshold.bloodGroup} (${editingThreshold.component})`}
        >
          <form onSubmit={handleSaveThreshold} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Minimum Stock Threshold (Units)
              </label>
              <input
                type="number"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Triggers a Low Stock Warning when available inventory drops below this number.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Critical Stock Threshold (Units)
              </label>
              <input
                type="number"
                min="0"
                value={critStock}
                onChange={(e) => setCritStock(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Triggers an Emergency Critical Alert when available inventory drops to or below this number.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingThreshold(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-blood-600 hover:bg-blood-700 text-white rounded-lg shadow-sm"
              >
                Save Thresholds
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
