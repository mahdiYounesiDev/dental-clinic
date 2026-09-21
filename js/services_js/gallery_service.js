import { supabase } from '../utils_js/supabaseClient.js';

class GalleryService {
    async uploadImage(file, bucketName) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(fileName, file);

        if (uploadError) throw new Error(uploadError.message);

        const { data } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);

        return data.publicUrl;
    }

    async getAllGalleryItems() {
        const { data, error } = await supabase
            .from('gallery')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return data;
    }

    async addGalleryItem(beforeFile, afterFile, title, doctorName, hashtag) {
        const beforeUrl = await this.uploadImage(beforeFile, 'gallery');
        const afterUrl = await this.uploadImage(afterFile, 'gallery');

        const { data, error } = await supabase
            .from('gallery')
            .insert([{
                title: title,
                before_image_url: beforeUrl,
                after_image_url: afterUrl,
                doctor_name: doctorName || null,
                hashtag: hashtag || null
            }])
            .select();

        if (error) throw new Error(error.message);
        return data[0];
    }

    async deleteGalleryItem(id, beforeUrl, afterUrl) {
        const filesToRemove = [];

        if (beforeUrl) filesToRemove.push(beforeUrl.split('/').pop());
        if (afterUrl) filesToRemove.push(afterUrl.split('/').pop());

        if (filesToRemove.length > 0) {
            await supabase.storage.from('gallery').remove(filesToRemove);
        }

        const { error: dbError } = await supabase
            .from('gallery')
            .delete()
            .eq('id', id);

        if (dbError) throw new Error(dbError.message);
        return true;
    }
}

window.galleryService = new GalleryService();
export const galleryService = window.galleryService;
