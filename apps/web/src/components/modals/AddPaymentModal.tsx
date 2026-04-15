import { Button } from "../ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../ui/sheet"
import { useModalStore } from "../../store/modalStore"

export const AddPaymentModal = () => {
  const { type, close } = useModalStore()
  const isOpen = type === "ADD_PAYMENT"

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent side="bottom">
        <SheetHeader className="px-0">
          <SheetTitle>To&apos;lov qo&apos;shish</SheetTitle>
          <SheetDescription>Bu sahifa tez orada tayyor bo&apos;ladi.</SheetDescription>
        </SheetHeader>

        <Button onClick={close} variant="outline" className="w-full">
          Yopish
        </Button>
      </SheetContent>
    </Sheet>
  )
}
