import { ExplorerLink } from '@/components/cluster/cluster-ui';
import toast from 'react-hot-toast';

export function useTransactionToast() {
  return (signature: string) => {
    toast.success(
      <div className={'text-center'}>
        <div className="text-lg">Transaction sent</div>
        <ExplorerLink
          path={`tx/${signature}`}
          label={'View Transaction'}
          className="btn btn-xs btn-primary"
        />
      </div>
    );
  };
}

export function useErrorToast() {
  return (error: string) => {
    toast.error(error);
  };
}
