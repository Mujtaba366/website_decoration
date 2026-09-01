"""
Product image upload: replaces the old admin form's "paste a URL" field
with a real file upload to Supabase Storage. Covers auth gating, content
type / size validation, and the happy path (using FakeSupabaseClient's
upload_file, not a real network call).
"""

import io
from base import ApiTestCase


class ProductImageUploadTests(ApiTestCase):
    def _upload(self, headers, filename='photo.jpg', content_type='image/jpeg', data=b'fake-image-bytes'):
        return self.client.post(
            '/api/admin/products/upload-image',
            data={'image': (io.BytesIO(data), filename, content_type)},
            headers=headers,
            content_type='multipart/form-data',
        )

    def test_requires_authentication(self):
        res = self._upload(headers={})
        self.assertEqual(res.status_code, 401)

    def test_successful_upload_returns_a_public_url(self):
        headers = self.auth_headers()
        res = self._upload(headers)
        self.assertEqual(res.status_code, 201, res.get_json())
        url = res.get_json()['url']
        self.assertIn('product-images', url)
        self.assertEqual(len(self.fake_db.uploaded_files), 1)
        bucket, path, content_type, size = self.fake_db.uploaded_files[0]
        self.assertEqual(bucket, 'product-images')
        self.assertTrue(path.endswith('.jpg'))
        self.assertEqual(content_type, 'image/jpeg')

    def test_missing_file_returns_400(self):
        headers = self.auth_headers()
        res = self.client.post('/api/admin/products/upload-image', data={}, headers=headers, content_type='multipart/form-data')
        self.assertEqual(res.status_code, 400)

    def test_disallowed_content_type_is_rejected(self):
        headers = self.auth_headers()
        res = self._upload(headers, filename='doc.pdf', content_type='application/pdf')
        self.assertEqual(res.status_code, 400)
        self.assertIn('Unsupported', res.get_json()['error'])

    def test_empty_file_is_rejected(self):
        headers = self.auth_headers()
        res = self._upload(headers, data=b'')
        self.assertEqual(res.status_code, 400)

    def test_oversized_file_is_rejected(self):
        headers = self.auth_headers()
        oversized = b'x' * (5 * 1024 * 1024 + 1)
        res = self._upload(headers, data=oversized)
        self.assertEqual(res.status_code, 400)
        self.assertIn('too large', res.get_json()['error'])


if __name__ == '__main__':
    import unittest
    unittest.main()
