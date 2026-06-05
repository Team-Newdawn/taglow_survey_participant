import { QuestionShell } from '../layout/QuestionShell';
import type { QuestionComponentProps } from '../utils/questionComponentTypes';
import { readMultiSelectMatrix } from './MultiSelectQuestion';
import { getDisplayOptions } from '../utils/questionOptions';
import '../css/SingleChoiceQuestion.css';

export function SingleChoiceQuestion(props: QuestionComponentProps<unknown>) {
  const value = typeof props.value === 'string' ? props.value : '';
  const options = getDisplayOptions(props.question, props.locale, props.fallbackLocale);
  const matrix = readMultiSelectMatrix(props.question, props.locale, props.fallbackLocale);

  return (
    <QuestionShell question={props.question} locale={props.locale} fallbackLocale={props.fallbackLocale} error={props.error} number={props.number}>
      {matrix ? (
        <div className="single-choice-question__matrix-scroll">
          <table className="single-choice-question__matrix">
            <thead>
              <tr>
                <th scope="col">
                  <span className="single-choice-question__visually-hidden">{props.question.id}</span>
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
                        <td key={column.value} className="single-choice-question__empty-cell">
                          <span aria-hidden="true">-</span>
                        </td>
                      );
                    }

                    return (
                      <td key={cell.value}>
                        <label className={`single-choice-question__matrix-option${value === cell.value ? ' is-selected' : ''}`}>
                          <input
                            type="radio"
                            name={props.question.id}
                            value={cell.value}
                            checked={value === cell.value}
                            aria-label={`${row.label}, ${column.label}`}
                            onChange={() => props.onChange(cell.value)}
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
        <div className="single-choice-question" role="radiogroup" aria-labelledby={`${props.question.id}-title`}>
          {options.map((option) => (
            <label
              key={option.value}
              className={`single-choice-question__option${value === option.value ? ' is-selected' : ''}`}
            >
              <input
                type="radio"
                name={props.question.id}
                value={option.value}
                checked={value === option.value}
                onChange={() => props.onChange(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      )}
    </QuestionShell>
  );
}
