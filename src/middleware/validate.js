import { validationResult } from 'express-validator';

export function validate(rules) {
  return [
    ...rules,
    (req, res, next) => {
      const result = validationResult(req);
      if (result.isEmpty()) return next();
      return res.status(422).json({
        success: false,
        message: result.array()[0].msg,
        errors: result.array().map((error) => ({ field: error.path, message: error.msg })),
      });
    },
  ];
}
