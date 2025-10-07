type Status = 'pending' | 'email_sent' | 'responded' | 'questioning' | 'completed';

const colorByStatus: Record<Status, string> = {
  pending: 'bg-red-100 text-red-800 border border-red-300',
  email_sent: 'bg-gray-100 text-gray-800 border border-gray-300',
  responded: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
  questioning: 'bg-orange-100 text-orange-800 border border-orange-300',
  completed: 'bg-green-100 text-green-800 border border-green-300',
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium inline-block ${colorByStatus[status]}`}>
      {status}
    </span>
  );
}


