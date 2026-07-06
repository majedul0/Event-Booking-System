
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
    <>
      <style>{`
        @media (max-width: 768px) {
          .pagination {
            flex-direction: column;
            gap: 8px !important;
            margin-top: 16px !important;
          }
          .pagination button {
            width: 100% !important;
            min-height: 36px !important;
            padding: 8px !important;
            font-size: 14px !important;
          }
          .pagination span {
            text-align: center;
            font-size: 14px;
          }
        }
      `}</style>
      <div
        className="pagination"
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
          border: '1px solid #999999',
          backgroundColor: page === 1 ? '#e8e8e8' : '#ffffff',
          color: '#000000',
          cursor: page === 1 ? 'default' : 'pointer',
          opacity: page === 1 ? 0.5 : 1,
        }}
      >
        Previous
      </button>

      <span style={{ color: '#000000' }}>
        Page {page} of {totalPages}
      </span>

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages || totalPages === 0}
        style={{
          padding: '6px 12px',
          borderRadius: '4px',
          border: '1px solid #999999',
          backgroundColor: page === totalPages || totalPages === 0 ? '#e8e8e8' : '#ffffff',
          color: '#000000',
          cursor: page === totalPages || totalPages === 0 ? 'default' : 'pointer',
          opacity: page === totalPages || totalPages === 0 ? 0.5 : 1,
        }}
      >
        Next
      </button>
      </div>
    </>
  );
}
