import React from 'react';
import { useAddressBook } from '../services/api';

const AddressBookPage: React.FC = () => {
  const { entries, loading, error } = useAddressBook();

  if (loading) return <p className="p-4">Loading...</p>;
  if (error) return <p className="p-4 text-danger-600">Error: {error}</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Address Book</h1>
      <table className="table w-full">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Country</th>
            <th>Tags</th>
            <th>Last Seen</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e)=> (
            <tr key={e.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-800">
              <td>{e.name}</td>
              <td>{e.entity_type}</td>
              <td>{e.email || '-'}</td>
              <td>{e.phone || '-'}</td>
              <td>{e.country || '-'}</td>
              <td>{e.tags || '-'}</td>
              <td>{e.last_seen_in || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AddressBookPage; 