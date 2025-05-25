import React, { useState, useEffect } from 'react';
import { useAddressBook, addressBookApi } from '../services/api';
import { Button } from '../components/ui/button';
import { Plus, SlidersHorizontal, Pencil, Trash } from 'lucide-react';
import DataTable from '../components/common/DataTable';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from '../components/ui/dropdown-menu';

const AddressBookPage: React.FC = () => {
  const { entries, loading, error, refresh } = useAddressBook();

  const [showModal, setShowModal] = useState(false);
  const STORAGE_KEY = 'address_hidden_cols';
  const defaultHidden = ['county', 'iban', 'bic', 'currency'];
  const [hiddenCols, setHiddenCols] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      return s ? JSON.parse(s) : defaultHidden;
    } catch { return defaultHidden; }
  });

  useEffect(()=>{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(hiddenCols));
  }, [hiddenCols]);

  const blankForm = {
    name: '',
    entity_type: 'company',
    email: '',
    phone: '',
    street: '',
    address2: '',
    town: '',
    zip: '',
    county: '',
    country: '',
    vat_id: '',
    tags: '',
    group_name: '',
    iban: '',
    bic: '',
    currency: '',
  };

  const [form, setForm] = useState<any>(blankForm);
  const [editingId, setEditingId] = useState<number|null>(null);

  const handleSubmit = async () => {
    // Duplicate check – same name & street+zip+town or same email
    const norm = (s:string)=> (s||'').trim().toLowerCase();
    const isDup = entries.some(e=> {
      if(editingId!=null && e.id===editingId) return false;
      const sameEmail = form.email && norm(e.email)===norm(form.email);
      const sameNameAddr = norm(e.name)===norm(form.name) && norm(e.street+e.zip+e.town)===norm(form.street+form.zip+form.town);
      return sameEmail || sameNameAddr;
    });
    if(isDup){
      alert('Duplicate entry detected (same name/address or email).');
      return;
    }
    if(editingId==null){
      await addressBookApi.create(form);
    } else {
      await addressBookApi.update(editingId, form);
    }
    setShowModal(false);
    setEditingId(null);
    setForm(blankForm);
    refresh();
  };

  const handleDelete = async (id:number) => {
    if(!window.confirm('Delete this entry?')) return;
    await addressBookApi.delete(id);
    refresh();
  };

  if (loading) return <p className="p-4">Loading...</p>;
  if (error) return <p className="p-4 text-danger-600">Error: {error}</p>;

  return (
    <div className="p-4">
      <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Address Book</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1 self-start">
                <SlidersHorizontal size={14}/> Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              {['name','company','street','address2','zip','town','county','country','email','phone','vat_id','iban','bic','currency','group_name','tags'].map(id=>(
                <DropdownMenuCheckboxItem key={id} checked={!hiddenCols.includes(id)} onCheckedChange={()=>setHiddenCols(prev=> prev.includes(id)? prev.filter(c=>c!==id): [...prev,id])}>{id}</DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus size={16} className="mr-1" /> New
        </Button>
      </div>

      {(() => {
        const allCols = [
          { id: 'name', header: 'Name', accessor: (r:any)=>r.name },
          { id: 'company', header: 'Company Name', accessor: (r:any)=> (r.entity_type==='company'?r.name:'-') },
          { id: 'street', header: 'Street', accessor: 'street' },
          { id: 'address2', header: 'Address 2', accessor: 'address2' },
          { id: 'zip', header: 'Zip', accessor: 'zip' },
          { id: 'town', header: 'Town', accessor: 'town' },
          { id: 'county', header: 'County', accessor: 'county' },
          { id: 'country', header: 'Country', accessor: 'country' },
          { id: 'email', header: 'Email', accessor: 'email' },
          { id: 'phone', header: 'Phone', accessor: 'phone' },
          { id: 'vat_id', header: 'VAT Number', accessor: 'vat_id' },
          { id: 'iban', header: 'IBAN', accessor: 'iban' },
          { id: 'bic', header: 'BIC', accessor: 'bic' },
          { id: 'currency', header: 'Currency', accessor: 'currency' },
          { id: 'group_name', header: 'Group/Sector', accessor: 'group_name' },
          { id: 'tags', header: 'Tags', accessor: (r:any)=>r.tags },
          { id: 'actions', header: '', accessor: (r:any)=> (
              <div className="flex gap-2">
                <button onClick={()=>{setEditingId(r.id); setForm({...blankForm, ...r}); setShowModal(true);}} className="text-secondary-500 hover:text-primary-600">
                  <Pencil size={16}/>
                </button>
                <button onClick={()=>handleDelete(r.id)} className="text-secondary-500 hover:text-danger-600">
                  <Trash size={16}/>
                </button>
              </div>
            ) },
        ];

        const visibleCols = allCols.filter((c) => !hiddenCols.includes(c.id));

        return (
          <DataTable
            enablePagination
            enableColumnPicker={false}
            columns={visibleCols}
            data={entries}
            isStriped
          />
        );
      })()}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-secondary-900 p-6 rounded-lg w-full max-w-lg">
            <h2 className="text-xl font-semibold mb-4">New Address Entry</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {Object.keys(form).map((k) => (
                <input
                  key={k}
                  className="border p-2 rounded col-span-2"
                  placeholder={k.replace('_', ' ')}
                  value={form[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                />
              ))}
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSubmit}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressBookPage; 