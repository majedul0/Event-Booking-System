
interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  limit,
  total,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.ceil(total / limit);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '12px',
        marginTop: '20px',
      }}
    >
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        style={{
          padding: '6px 12px',
          borderRadius: '4px',
          border: '1px solid #ddd',
          backgroundColor: page === 1 ? '#f5f5f5' : 'white',
          cursor: page === 1 ? 'default' : 'pointer',
          opacity: page === 1 ? 0.5 : 1,
        }}
      >
        Previous
      </button>

      <span style={{ color: '#666' }}>
        Page {page} of {totalPages}
      </span>

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages || totalPages === 0}
        style={{
          padding: '6px 12px',
          borderRadius: '4px',
          border: '1px solid #ddd',
          backgroundColor: page === totalPages || totalPages === 0 ? '#f5f5f5' : 'white',
          cursor: page === totalPages || totalPages === 0 ? 'default' : 'pointer',
          opacity: page === totalPages || totalPages === 0 ? 0.5 : 1,
        }}
      >
        Next
      </button>
    </div>
  );
}
