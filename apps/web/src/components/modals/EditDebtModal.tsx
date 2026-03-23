import { useModalStore } from '../../store/modalStore';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet';

export const EditDebtModal = () => {
  const { type, close } = useModalStore();
  const isOpen = type === 'EDIT_DEBT';

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent side="bottom" className="rounded-t-3xl pb-6">
        <SheetHeader className="px-0">
          <SheetTitle>Qarzni tahrirlash</SheetTitle>
          <SheetDescription>Bu sahifa tez orada tayyor bo'ladi</SheetDescription>
        </SheetHeader>

        <Button onClick={close} variant="outline" className="w-full">
          Yopish
        </Button>
      </SheetContent>
    </Sheet>
  );
};