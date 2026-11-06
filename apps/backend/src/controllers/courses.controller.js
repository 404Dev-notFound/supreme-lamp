const { coursesService } = require("../services/courses.service");

class CoursesController {
  async getCourses(req, res, next) {
    try {
      const { category, level, search } = req.query;
      const courses = await coursesService.listCourses({ category, level, search });
      return res.status(200).json({
        success: true,
        count: courses.length,
        data: courses,
      });
    } catch (err) {
      next(err);
    }
  }

  async getCourseBySlug(req, res, next) {
    try {
      const { slug } = req.params;
      const course = await coursesService.getCourseBySlug(slug);
      if (!course) {
        return res.status(404).json({
          success: false,
          error: "Course not found",
        });
      }
      return res.status(200).json({
        success: true,
        data: course,
      });
    } catch (err) {
      next(err);
    }
  }
}

const coursesController = new CoursesController();

module.exports = { coursesController };

