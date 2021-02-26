import {
  ValidateEventFilter,
  validate,
  EventFilterSchema,
  EventFilter,
} from './types'

const validateEventFilter: ValidateEventFilter = (
  filter: EventFilter
): void => {
  validate(EventFilterSchema, filter)
}

export default validateEventFilter
