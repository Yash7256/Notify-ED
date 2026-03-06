const MARK_RANGES = {
  midTerm: { min: 0, max: 30 },
  endTerm: { min: 0, max: 50 },
  assignment: { min: 0, max: 20 },
  attendance: { min: 0, max: 100 }
};

function validateMarkEntry(entry, index) {
  if (!entry || typeof entry !== 'object') {
    return `marks[${index}] must be an object`;
  }

  if (!entry.studentId) {
    return `marks[${index}].studentId is required`;
  }
  if (!entry.subjectId) {
    return `marks[${index}].subjectId is required`;
  }

  for (const [key, range] of Object.entries(MARK_RANGES)) {
    const value = entry[key];
    if (value === undefined || value === null) {
      return `marks[${index}].${key} is required`;
    }
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return `marks[${index}].${key} must be a number`;
    }
    if (value < range.min || value > range.max) {
      return `marks[${index}].${key} must be between ${range.min} and ${range.max}`;
    }
  }

  return null;
}

function validateSubmitPayload(body) {
  if (!body || typeof body !== 'object') return 'Request body must be a JSON object';

  const { submittedBy, marks, sessionId } = body;

  if (!Array.isArray(marks) || marks.length === 0) {
    return 'marks must be a non-empty array';
  }

  for (let i = 0; i < marks.length; i += 1) {
    const error = validateMarkEntry(marks[i], i);
    if (error) return error;
  }

  return null;
}

function validateResendPayload(body) {
  if (!body || typeof body !== 'object') return 'Request body must be a JSON object';
  const { ids } = body;
  if (!Array.isArray(ids) || ids.length === 0) return 'ids must be a non-empty array';
  const hasInvalid = ids.some((id) => typeof id !== 'string' || !id.length);
  if (hasInvalid) return 'Each id must be a non-empty string';
  return null;
}

module.exports = {
  validateSubmitPayload,
  validateResendPayload,
  MARK_RANGES
};
