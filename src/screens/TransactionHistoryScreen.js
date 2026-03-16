import { getTransactions } from "../services/transactionService";

useEffect(() => {
  loadTransactions();
}, []);

const loadTransactions = async () => {
  setLoading(true);
  try {
    const data = await getTransactions();
    setTransactions(data);
  } catch (error) {
    setError("Unable to load transactions");
  }
  setLoading(false);
};