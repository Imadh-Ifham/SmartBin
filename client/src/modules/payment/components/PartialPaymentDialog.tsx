import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import type { Invoice } from "../types/payment";

interface PartialPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  onSubmit: (amount: number) => void;
}

export function PartialPaymentDialog({
  open,
  onOpenChange,
  invoice,
  onSubmit,
}: PartialPaymentDialogProps) {
  const max = useMemo(() => {
    if (!invoice) return 0;
    return invoice.outstanding ?? invoice.amount;
  }, [invoice]);

  const [amount, setAmount] = useState<string>("");
  const parsed = Number(amount);
  const invalid = !amount || isNaN(parsed) || parsed <= 0 || parsed > max;

  useEffect(() => {
    if (open) setAmount("");
  }, [open]);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
    }).format(v);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pay a partial amount</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <p className="text-gray-600" style={{ fontSize: "14px" }}>
              Enter an amount up to {formatCurrency(max)}.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="partial-amount">Amount (LKR)</Label>
            <Input
              id="partial-amount"
              type="number"
              min={1}
              max={max}
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {invalid && amount && (
              <p className="text-red-600" style={{ fontSize: "12px" }}>
                Please enter a valid amount between 1 and {Math.floor(max)}.
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-green-700 hover:bg-green-800 text-white"
            onClick={() => {
              if (!invalid) {
                onSubmit(parsed);
                onOpenChange(false);
              }
            }}
            disabled={invalid}
          >
            Continue to Pay
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PartialPaymentDialog;
