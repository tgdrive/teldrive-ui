import { type CheckboxProps, Chip, tv, useCheckbox, VisuallyHidden } from "@tw-material/react";
import MingcuteCheck2Line from "~icons/mingcute/check-2-line";

const checkbox = tv({
  slots: {
    base: "border-outline border-medium bg-transparent py-4 px-2 select-none transition duration-200",
    content: "text-current",
  },
  variants: {
    isSelected: {
      true: {
        base: "bg-secondary-container border-secondary-container",
      },
    },
    isFocusVisible: {
      true: {
        base: "outline-none ring-2 ring-secondary ring-offset-2 ring-offset-background",
      },
    },
  },
});

interface FilterChipProps extends CheckboxProps {
  startIcon: React.ReactNode;
}

export const FilterChip = ({ startIcon, ...props }: FilterChipProps) => {
  const { children, isSelected, isFocusVisible, getBaseProps, getLabelProps, getInputProps } =
    useCheckbox({
      ...props,
    });

  const styles = checkbox({ isSelected, isFocusVisible });

  return (
    <label {...getBaseProps()}>
      <VisuallyHidden>
        <input {...getInputProps()} />
      </VisuallyHidden>
      <Chip
        classNames={{
          base: styles.base(),
          content: styles.content(),
        }}
        startContent={
          isSelected ? (
            <MingcuteCheck2Line className="size-5 max-h-none" />
          ) : startIcon ? (
            startIcon
          ) : null
        }
        {...getLabelProps()}
      >
        {children}
      </Chip>
    </label>
  );
};
