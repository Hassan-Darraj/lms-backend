import CourseModel from "../models/courseModel.js";
import { courseSchema } from "../utils/validation.js";

const CourseController = {
  async createCourse(req, res, next) {
    try {
      if (req.file) {
      req.body.thumbnail_url = req.file.path; // أو استخدم req.file.filename حسب ما تريد تخزينه
    }
      const { error, value } = courseSchema.validate(req.body);
      if (error) return res.status(400).json({ success: false, error: error.message });

      const course = await CourseModel.create(value);
      res.status(201).json({ success: true, data: course });
    } catch (error) {
      next(error);
    }
  },

  async getAllCourses(req, res, next) {
    try {
      const courses = await CourseModel.findAll();
      res.json({ success: true, data: courses });
    } catch (error) {
      next(error);
    }
  },

  async getCourseById(req, res, next) {
    try {
      console.log('Getting course with ID:', req.params.id);
      const course = await CourseModel.findById(req.params.id);
      console.log('Course found:', course);
      if (!course) {
        console.log('Course not found');
        return res.status(404).json({ success: false, error: "Course not found" });
      }
      res.json({ success: true, data: course });
    } catch (error) {
      console.error('Error in getCourseById:', error);
      next(error);
    }
  },

  async updateCourse(req, res, next) {
    try {
      const { error, value } = courseSchema.validate(req.body);
      if (error) return res.status(400).json({ success: false, error: error.message });

      const course = await CourseModel.update(req.params.id, value);
      if (!course) return res.status(404).json({ success: false, error: "Course not found" });
      res.json({ success: true, data: course });
    } catch (error) {
      next(error);
    }
  },

  async deleteCourse(req, res, next) {
    try {
      const course = await CourseModel.delete(req.params.id);
      if (!course) return res.status(404).json({ success: false, error: "Course not found" });
      res.json({ success: true, message: "Course deleted successfully" });
    } catch (error) {
      next(error);
    }
  },

  async getCoursesByCategory(req, res, next) {
    const { categoryId } = req.params;
  
    try {
      const courses = await CourseModel.getCoursesByCategory(categoryId);
  
      if (!courses || courses.length === 0) {
        return res.status(404).json({ message: 'No courses found for this category.' });
      }
  
      res.status(200).json({ data: courses });
    } catch (error) {
      console.error('Error fetching courses by category:', error);
      next(error); // Pass to Express error handler
    }
  }
  
};

export default CourseController;
