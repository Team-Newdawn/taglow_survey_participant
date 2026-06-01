import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

type UseSectionSurveyFormArgs = {
  values: Record<string, unknown>;
  onValuesChange: (values: Record<string, unknown>) => void;
  onDirty: () => void;
};

export function useSectionSurveyForm(args: UseSectionSurveyFormArgs) {
  const { values, onValuesChange, onDirty } = args;
  const form = useForm<Record<string, unknown>>({ defaultValues: values });

  useEffect(() => {
    const subscription = form.watch((nextValues, info) => {
      if (!info.name) {
        return;
      }

      onValuesChange(nextValues as Record<string, unknown>);
      onDirty();
    });

    return () => subscription.unsubscribe();
  }, [form, onDirty, onValuesChange]);

  return form;
}
