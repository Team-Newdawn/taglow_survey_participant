import type { Locale, PublicQuestion } from '../../../../../api/participant';
import { QuestionShell } from './QuestionShell';
import type { QuestionComponentProps } from './questionComponentTypes';
import { getSurveyLocaleCopy, type SurveyLocaleCopy } from '../../surveyLocaleCopy';
import { getDisplayOptions, getQuestionOptions } from './questionOptions';
import './css/MultiSelectQuestion.css';

type MultiSelectValue = {
  selectedOptions?: string[];
  otherText?: string;
};

export type MatrixItem = {
  value: string;
  label: string;
};

export type MatrixCell = {
  row: MatrixItem;
  column: MatrixItem;
  value: string;
};

export type MultiSelectMatrix = {
  rows: MatrixItem[];
  columns: MatrixItem[];
  cells: MatrixCell[];
};

export function MultiSelectQuestion(props: QuestionComponentProps<unknown>) {
  const value = readMultiSelectValue(props.value);
  const selectedOptions = value.selectedOptions ?? [];
  const options = getDisplayOptions(props.question, props.locale, props.fallbackLocale);
  const matrix = readMultiSelectMatrix(props.question, props.locale, props.fallbackLocale);
  const minSelections = readSelectionLimit(
    props.question.validation.minSelections ?? props.question.validation.minSelect ?? props.question.config.minSelections ?? props.question.config.minSelect,
  );
  const maxSelections = readSelectionLimit(
    props.question.validation.maxSelections ?? props.question.validation.maxSelect ?? props.question.config.maxSelections ?? props.question.config.maxSelect,
  );
  const copy = getSurveyLocaleCopy(props.locale);

  const toggle = (optionValue: string) => {
    const isSelected = selectedOptions.includes(optionValue);
    if (!isSelected && maxSelections !== undefined && selectedOptions.length >= maxSelections) {
      return;
    }

    props.onChange({
      ...value,
      selectedOptions: isSelected ? selectedOptions.filter((item) => item !== optionValue) : [...selectedOptions, optionValue],
    });
  };

  return (
    <QuestionShell question={props.question} locale={props.locale} fallbackLocale={props.fallbackLocale} error={props.error} number={props.number}>
      <div className="multi-select-question">
        <p>{buildSelectionGuide({ selectedCount: selectedOptions.length, minSelections, maxSelections, copy })}</p>
        {matrix ? (
          <div className="multi-select-question__matrix-scroll">
            <table className="multi-select-question__matrix" style={{ minWidth: buildMatrixMinWidth(matrix) }}>
              <thead>
                <tr>
                  <th scope="col">
                    <span className="multi-select-question__visually-hidden">{copy.selectAllThatApply}</span>
                  </th>
                  {matrix.columns.map((column) => (
                    <th key={column.value} scope="col">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.rows.map((row) => (
                  <tr key={row.value}>
                    <th scope="row">{row.label}</th>
                    {matrix.columns.map((column) => {
                      const cell = matrix.cells.find((item) => item.row.value === row.value && item.column.value === column.value);

                      if (!cell) {
                        return (
                          <td key={column.value} className="multi-select-question__empty-cell">
                            <span aria-hidden="true">-</span>
                          </td>
                        );
                      }

                      const isSelected = selectedOptions.includes(cell.value);
                      const isDisabled = !isSelected && maxSelections !== undefined && selectedOptions.length >= maxSelections;

                      return (
                        <td key={cell.value}>
                          <label className={`multi-select-question__matrix-option${isSelected ? ' is-selected' : ''}${isDisabled ? ' is-disabled' : ''}`}>
                            <input
                              type="checkbox"
                              value={cell.value}
                              checked={isSelected}
                              disabled={isDisabled}
                              aria-label={`${row.label}, ${column.label}`}
                              onChange={() => toggle(cell.value)}
                            />
                          </label>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="multi-select-question__options">
            {options.map((option) => {
              const isSelected = selectedOptions.includes(option.value);
              const isDisabled = !isSelected && maxSelections !== undefined && selectedOptions.length >= maxSelections;

              return (
                <label
                  key={option.value}
                  className={`multi-select-question__option${isSelected ? ' is-selected' : ''}${isDisabled ? ' is-disabled' : ''}`}
                >
                  <input
                    type="checkbox"
                    value={option.value}
                    checked={isSelected}
                    disabled={isDisabled}
                    onChange={() => toggle(option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              );
            })}
          </div>
        )}
        {hasOtherSelection(selectedOptions, matrix) ? (
          <label className="multi-select-question__other">
            {copy.otherTextLabel}
            <input
              value={value.otherText ?? ''}
              placeholder={copy.otherTextPlaceholder}
              onChange={(event) => props.onChange({ ...value, otherText: event.target.value })}
            />
          </label>
        ) : null}
      </div>
    </QuestionShell>
  );
}

function readMultiSelectValue(value: unknown): MultiSelectValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as MultiSelectValue) : {};
}

function readSelectionLimit(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;
}

function buildMatrixMinWidth(matrix: MultiSelectMatrix): string {
  const rowHeaderWidth = 50;
  const columnWidth = 120;
  const minimumWidth = Math.max(640, rowHeaderWidth + matrix.columns.length * columnWidth);

  return `${minimumWidth}px`;
}

export function readMultiSelectMatrix(question: PublicQuestion, locale: Locale, fallbackLocale: Locale): MultiSelectMatrix | undefined {
  const explicitRows = readMatrixItems(readConfigArray(question.config, ['rows', 'matrixRows', 'matrix_rows', 'rowOptions', 'row_options']), locale, fallbackLocale);
  const explicitColumns = readMatrixItems(
    readConfigArray(question.config, ['columns', 'matrixColumns', 'matrix_columns', 'columnOptions', 'column_options']),
    locale,
    fallbackLocale,
  );

  if (explicitRows.length > 0) {
    const columns = explicitColumns.length > 0 ? explicitColumns : getDisplayOptions(question, locale, fallbackLocale);

    if (columns.length > 0) {
      return {
        rows: explicitRows,
        columns,
        cells: buildExplicitMatrixCells(question, explicitRows, columns, locale, fallbackLocale),
      };
    }
  }

  return (
    readOptionMetadataMatrix(question, locale, fallbackLocale) ??
    readOptionCountMatrix(question, locale, fallbackLocale) ??
    readDelimitedOptionLabelMatrix(question, locale, fallbackLocale)
  );
}

function readOptionMetadataMatrix(question: PublicQuestion, locale: Locale, fallbackLocale: Locale): MultiSelectMatrix | undefined {
  const cells: MatrixCell[] = [];
  const rowMap = new Map<string, MatrixItem>();
  const columnMap = new Map<string, MatrixItem>();

  for (const option of getQuestionOptions(question)) {
    const metadata = option.metadata ?? {};
    const rowValue = readFirstString(metadata, ['rowValue', 'row_value', 'rowKey', 'row_key', 'row']) ?? readIndexValue(metadata, ['rowIndex', 'row_index']);
    const columnValue =
      readFirstString(metadata, ['columnValue', 'column_value', 'columnKey', 'column_key', 'column', 'colValue', 'col_value', 'colKey', 'col_key', 'col']) ??
      readIndexValue(metadata, ['columnIndex', 'column_index', 'colIndex', 'col_index']);

    if (!rowValue || !columnValue) {
      continue;
    }

    const row = readMetadataItem(metadata, 'row', rowValue, locale, fallbackLocale);
    const column = readMetadataItem(metadata, 'column', columnValue, locale, fallbackLocale);
    rowMap.set(row.value, row);
    columnMap.set(column.value, column);
    cells.push({
      row,
      column,
      value: option.value,
    });
  }

  if (rowMap.size === 0 || columnMap.size === 0) {
    return undefined;
  }

  return {
    rows: [...rowMap.values()],
    columns: [...columnMap.values()],
    cells,
  };
}

function buildExplicitMatrixCells(
  question: PublicQuestion,
  rows: MatrixItem[],
  columns: MatrixItem[],
  locale: Locale,
  fallbackLocale: Locale,
): MatrixCell[] {
  const options = getDisplayOptions(question, locale, fallbackLocale);
  const hasConfiguredOptions = options.length > 0;

  return rows.flatMap((row) =>
    columns
      .map((column) => {
        const matchedOptionValue =
          readExplicitCellValue(question.config, row.value, column.value) ?? readMatrixOptionValue(question, options, row, column);

        if (!matchedOptionValue && hasConfiguredOptions) {
          return undefined;
        }

        return {
          row,
          column,
          value: matchedOptionValue ?? `${row.value}:${column.value}`,
        };
      })
      .filter((cell): cell is MatrixCell => Boolean(cell)),
  );
}

function readMatrixOptionValue(
  question: PublicQuestion,
  options: Array<{ value: string; label: string }>,
  row: MatrixItem,
  column: MatrixItem,
): string | undefined {
  const separator = readString(question.config.matrixValueSeparator) ?? readString(question.config.matrix_value_separator) ?? ':';
  const valueOrder = readString(question.config.matrixValueOrder) ?? readString(question.config.matrix_value_order);
  const preferredCandidates =
    valueOrder === 'row-column' || valueOrder === 'row_column'
      ? [`${row.value}${separator}${column.value}`, `${column.value}${separator}${row.value}`]
      : [`${column.value}${separator}${row.value}`, `${row.value}${separator}${column.value}`];
  const candidates = [...preferredCandidates, `${row.value}:${column.value}`, `${column.value}:${row.value}`];
  const valueMatch = options.find((option) => candidates.includes(option.value));

  if (valueMatch) {
    return valueMatch.value;
  }

  return options.find((option) => optionLabelMatchesMatrixCell(option.label, row, column, question.config))?.value;
}

function optionLabelMatchesMatrixCell(label: string, row: MatrixItem, column: MatrixItem, config: PublicQuestion['config']): boolean {
  const parts = splitMatrixLabel(label, config);

  if (!parts) {
    return false;
  }

  return (
    (parts[0] === row.label && parts[1] === column.label) ||
    (parts[0] === column.label && parts[1] === row.label) ||
    (parts[0] === row.value && parts[1] === column.value) ||
    (parts[0] === column.value && parts[1] === row.value)
  );
}

function readOptionCountMatrix(question: PublicQuestion, locale: Locale, fallbackLocale: Locale): MultiSelectMatrix | undefined {
  const rowCount = readMatrixCount(question.config, ['rowCount', 'row_count', 'rowsCount', 'rows_count', 'matrixRowCount', 'matrix_row_count', 'rows']);
  const columnCount = readMatrixCount(question.config, [
    'columnCount',
    'column_count',
    'columnsCount',
    'columns_count',
    'matrixColumnCount',
    'matrix_column_count',
    'colCount',
    'col_count',
    'colsCount',
    'cols_count',
    'columns',
    'cols',
  ]);
  const options = getDisplayOptions(question, locale, fallbackLocale);

  if (!rowCount || !columnCount || rowCount < 1 || columnCount < 1 || options.length !== rowCount * columnCount) {
    return undefined;
  }

  const labelOrder = readString(question.config.matrixLabelOrder) ?? readString(question.config.matrix_label_order);
  const usesColumnFirst = labelOrder === 'column-row' || labelOrder === 'column_row';
  const configuredRows = readMatrixItems(
    readConfigArray(question.config, ['rowLabels', 'row_labels', 'matrixRowLabels', 'matrix_row_labels']),
    locale,
    fallbackLocale,
  );
  const configuredColumns = readMatrixItems(
    readConfigArray(question.config, ['columnLabels', 'column_labels', 'matrixColumnLabels', 'matrix_column_labels', 'colLabels', 'col_labels']),
    locale,
    fallbackLocale,
  );
  const rows = Array.from({ length: rowCount }, (_, rowIndex) => {
    const firstOption = options[rowIndex * columnCount];
    const splitLabel = firstOption ? splitMatrixLabel(firstOption.label, question.config) : undefined;
    const inferredLabel = splitLabel ? (usesColumnFirst ? splitLabel[1] : splitLabel[0]) : undefined;
    return configuredRows[rowIndex] ?? {
      value: inferredLabel ?? String(rowIndex + 1),
      label: inferredLabel ?? String(rowIndex + 1),
    };
  });
  const columns = Array.from({ length: columnCount }, (_, columnIndex) => {
    const firstOption = options[columnIndex];
    const splitLabel = firstOption ? splitMatrixLabel(firstOption.label, question.config) : undefined;
    const inferredLabel = splitLabel ? (usesColumnFirst ? splitLabel[0] : splitLabel[1]) : undefined;
    return configuredColumns[columnIndex] ?? {
      value: inferredLabel ?? String(columnIndex + 1),
      label: inferredLabel ?? String(columnIndex + 1),
    };
  });

  return {
    rows,
    columns,
    cells: options.map((option, optionIndex) => ({
      row: rows[Math.floor(optionIndex / columnCount)],
      column: columns[optionIndex % columnCount],
      value: option.value,
    })),
  };
}

function readMatrixCount(config: PublicQuestion['config'], keys: string[]): number | undefined {
  for (const key of keys) {
    const value = config[key];

    if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
      return value;
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value);
      if (Number.isInteger(parsed) && parsed > 0) {
        return parsed;
      }
    }
  }

  return undefined;
}

function readDelimitedOptionLabelMatrix(question: PublicQuestion, locale: Locale, fallbackLocale: Locale): MultiSelectMatrix | undefined {
  const options = getDisplayOptions(question, locale, fallbackLocale);
  const parsedOptions = options
    .map((option) => {
      const parts = splitMatrixLabel(option.label, question.config);
      return parts ? { option, parts } : undefined;
    })
    .filter((item): item is { option: (typeof options)[number]; parts: [string, string] } => Boolean(item));

  if (parsedOptions.length !== options.length || parsedOptions.length < 2) {
    return undefined;
  }

  const labelOrder = readString(question.config.matrixLabelOrder) ?? readString(question.config.matrix_label_order);
  const usesColumnFirst = labelOrder === 'column-row' || labelOrder === 'column_row';
  const rows = new Map<string, MatrixItem>();
  const columns = new Map<string, MatrixItem>();
  const cells: MatrixCell[] = [];

  for (const { option, parts } of parsedOptions) {
    const rowLabel = usesColumnFirst ? parts[1] : parts[0];
    const columnLabel = usesColumnFirst ? parts[0] : parts[1];
    const row = { value: rowLabel, label: rowLabel };
    const column = { value: columnLabel, label: columnLabel };

    rows.set(row.value, row);
    columns.set(column.value, column);
    cells.push({
      row,
      column,
      value: option.value,
    });
  }

  const repeatsRow = rows.size < parsedOptions.length;
  const repeatsColumn = columns.size < parsedOptions.length;

  if (rows.size < 1 || columns.size < 2 || (!repeatsRow && !repeatsColumn)) {
    return undefined;
  }

  return {
    rows: [...rows.values()],
    columns: [...columns.values()],
    cells,
  };
}

function splitMatrixLabel(label: string, config: PublicQuestion['config']): [string, string] | undefined {
  const delimiter = readString(config.matrixLabelDelimiter) ?? readString(config.matrix_label_delimiter);
  const parts = delimiter ? label.split(delimiter) : label.split(/\s[-–—]\s/);

  if (parts.length !== 2) {
    return undefined;
  }

  const first = parts[0]?.trim();
  const second = parts[1]?.trim();

  return first && second ? [first, second] : undefined;
}

function readMatrixItems(items: unknown[] | undefined, locale: Locale, fallbackLocale: Locale): MatrixItem[] {
  return (items ?? []).map((item) => readMatrixItem(item, locale, fallbackLocale)).filter((item): item is MatrixItem => Boolean(item));
}

function readMatrixItem(item: unknown, locale: Locale, fallbackLocale: Locale): MatrixItem | undefined {
  if (typeof item === 'string' && item.trim().length > 0) {
    return { value: item.trim(), label: item.trim() };
  }

  const record = readRecord(item);
  const value = readFirstString(record, ['value', 'id', 'key', 'code', 'optionValue', 'option_value']);

  if (!value) {
    return undefined;
  }

  return {
    value,
    label: readLocalizedLabel(record, locale, fallbackLocale) ?? value,
  };
}

function readMetadataItem(
  metadata: Record<string, unknown>,
  axis: 'row' | 'column',
  value: string,
  locale: Locale,
  fallbackLocale: Locale,
): MatrixItem {
  const prefix = axis === 'row' ? 'row' : 'column';
  const label =
    readLocalizedLabel(
      {
        label: metadata[`${prefix}Label`],
        label_ko: metadata[`${prefix}_label_ko`],
        labelKo: metadata[`${prefix}LabelKo`],
        label_en: metadata[`${prefix}_label_en`],
        labelEn: metadata[`${prefix}LabelEn`],
      },
      locale,
      fallbackLocale,
    ) ?? value;

  return { value, label };
}

function readExplicitCellValue(config: PublicQuestion['config'], rowValue: string, columnValue: string): string | undefined {
  const cells = readConfigArray(config, ['cells', 'matrixCells', 'matrix_cells']);

  for (const cell of cells ?? []) {
    const record = readRecord(cell);
    const row = readFirstString(record, ['rowValue', 'row_value', 'rowKey', 'row_key', 'row']);
    const column = readFirstString(record, ['columnValue', 'column_value', 'columnKey', 'column_key', 'column']);

    if (row === rowValue && column === columnValue) {
      return readFirstString(record, ['value', 'id', 'key', 'code', 'optionValue', 'option_value']);
    }
  }

  return undefined;
}

function readConfigArray(config: PublicQuestion['config'], keys: string[]): unknown[] | undefined {
  for (const key of keys) {
    const value = config[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return undefined;
}

function readLocalizedLabel(record: Record<string, unknown>, locale: Locale, fallbackLocale: Locale): string | undefined {
  const label = record.label;

  if (typeof label === 'object' && label !== null && !Array.isArray(label)) {
    const localized = label as Record<string, unknown>;
    return readLocaleString(localized, locale) ?? readLocaleString(localized, fallbackLocale) ?? readLocaleString(localized, 'ko') ?? readLocaleString(localized, 'en');
  }

  if (typeof label === 'string' && label.trim().length > 0) {
    return label.trim();
  }

  return (
    readLocaleString(record, locale === 'en' ? 'labelEn' : 'labelKo') ??
    readLocaleString(record, locale === 'en' ? 'label_en' : 'label_ko') ??
    readLocaleString(record, fallbackLocale === 'en' ? 'labelEn' : 'labelKo') ??
    readLocaleString(record, fallbackLocale === 'en' ? 'label_en' : 'label_ko') ??
    readFirstString(record, ['title', 'text', 'name'])
  );
}

function readLocaleString(record: Record<string, unknown>, key: string): string | undefined {
  return readString(record[key]);
}

function readFirstString(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = readString(record[key]);
    if (value) {
      return value;
    }
  }

  return undefined;
}

function readIndexValue(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
      return String(value);
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value);
      if (Number.isInteger(parsed) && parsed >= 0) {
        return String(parsed);
      }
    }
  }

  return undefined;
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function readRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function hasOtherSelection(selectedOptions: string[], matrix: MultiSelectMatrix | undefined): boolean {
  if (selectedOptions.includes('other')) {
    return true;
  }

  if (!matrix) {
    return false;
  }

  return selectedOptions.some((selectedOption) => {
    const cell = matrix.cells.find((item) => item.value === selectedOption);
    return cell?.column.value === 'other';
  });
}

function buildSelectionGuide(args: { selectedCount: number; minSelections?: number; maxSelections?: number; copy: SurveyLocaleCopy }): string {
  const selectedText = args.copy.selectedCount(args.selectedCount);

  if (args.minSelections && args.maxSelections) {
    return `${selectedText} · ${args.copy.minMaxSelections(args.minSelections, args.maxSelections)}`;
  }

  if (args.maxSelections) {
    return `${selectedText} · ${args.copy.maxSelections(args.maxSelections)}`;
  }

  if (args.minSelections) {
    return `${selectedText} · ${args.copy.minSelections(args.minSelections)}`;
  }

  return `${selectedText} · ${args.copy.selectAllThatApply}`;
}
