-- Migration to delete pre-seeded blog posts.
DELETE FROM blog_posts WHERE author_slug = 'recv-core';
