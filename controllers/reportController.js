import UserModel from "../models/userModel.js";
import CourseModel from "../models/courseModel.js";
import EnrollmentModel from "../models/enrollmentModel.js";

const ReportController = {
  // Get user activity report
  async getUserActivityReport(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      
      // Get user activity data (last login, course enrollments, etc.)
      const users = await UserModel.getUserActivity({
        startDate,
        endDate,
      });

      res.json({
        success: true,
        data: {
          totalUsers: users.length,
          activeUsers: users.filter(u => u.last_login).length,
          users,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Get course popularity report
  async getCoursePopularityReport(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      
      // Get course enrollment data
      const courses = await CourseModel.getPopularCourses({
        startDate,
        endDate,
      });

      res.json({
        success: true,
        data: {
          totalCourses: courses.length,
          totalEnrollments: courses.reduce((sum, course) => sum + course.enrollmentCount, 0),
          courses,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Get system usage statistics
  async getSystemUsageReport(req, res, next) {
    try {
      const [
        totalUsers,
        totalCourses,
        totalEnrollments,
        activeUsersThisMonth,
      ] = await Promise.all([
        UserModel.countTotalUsers(),
        CourseModel.countTotalCourses(),
        EnrollmentModel.countTotalEnrollments(),
        UserModel.countActiveUsersThisMonth(),
      ]);

      res.json({
        success: true,
        data: {
          totalUsers,
          totalCourses,
          totalEnrollments,
          activeUsersThisMonth,
          reportGeneratedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

export default ReportController;
