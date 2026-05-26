export const LoadingSpinner = ({ message }) => {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <div className="spinner"></div>
      <p>{message}</p>
    </div>
  );
};