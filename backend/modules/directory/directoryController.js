// modules/directory/directoryController.js
const DirectoryModel = require('./directoryModel');

class DirectoryController {

    static async search(req, res) {
        try {
            const { query, staffType, departmentId, page = 1, limit = 12 } = req.query;

            console.log('🔍 Directory search request:', { query, staffType, departmentId, page, limit });

            const results = await DirectoryModel.search({
                query: query || '',
                staffType: staffType || '',
                departmentId: departmentId || '',
                page: parseInt(page),
                limit: parseInt(limit)
            });

            console.log(`✅ Returning ${results.staff?.length || 0} results`);

            return res.status(200).json({ 
                success: true, 
                data: results 
            });
        } catch (error) {
            console.error('❌ Directory search error:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'Error fetching directory',
                error: error.message 
            });
        }
    }

    static async getProfile(req, res) {
        try {
            const { staffId } = req.params;
            const requesterRole = req.user?.role || 'student';

            const profile = await DirectoryModel.getProfile(parseInt(staffId), requesterRole);

            if (!profile) {
                return res.status(404).json({ success: false, message: 'Staff member not found' });
            }

            return res.status(200).json({ success: true, data: { profile } });
        } catch (error) {
            console.error('Get profile error:', error);
            return res.status(500).json({ success: false, message: 'Error fetching profile' });
        }
    }

    static async getDepartments(req, res) {
        try {
            const departments = await DirectoryModel.getDepartments();
            return res.status(200).json({ success: true, data: { departments } });
        } catch (error) {
            console.error('Get departments error:', error);
            return res.status(500).json({ success: false, message: 'Error fetching departments' });
        }
    }

    static async getFilters(req, res) {
        try {
            const filters = await DirectoryModel.getFilters();
            return res.status(200).json({ success: true, data: filters });
        } catch (error) {
            console.error('Get filters error:', error);
            return res.status(500).json({ success: false, message: 'Error fetching filters' });
        }
    }
}

module.exports = DirectoryController;