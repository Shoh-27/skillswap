<?php

namespace Database\Seeders;

use App\Models\Skill;
use Illuminate\Database\Seeder;

class SkillSeeder extends Seeder
{
    /**
     * Predefined skills list — covers tech, languages, creative, and life skills.
     */
    public function run(): void
    {
        $skills = [
            // Programming & Tech
            'PHP',
            'Laravel',
            'JavaScript',
            'TypeScript',
            'React',
            'Vue.js',
            'Next.js',
            'Node.js',
            'Python',
            'Django',
            'FastAPI',
            'Java',
            'Spring Boot',
            'Kotlin',
            'Swift',
            'Go',
            'Rust',
            'C++',
            'C#',
            '.NET',
            'Ruby on Rails',
            'SQL',
            'PostgreSQL',
            'MySQL',
            'MongoDB',
            'Redis',
            'Docker',
            'Kubernetes',
            'AWS',
            'Google Cloud',
            'Azure',
            'DevOps',
            'CI/CD',
            'GraphQL',
            'REST API Design',
            'Linux',
            'Git',
            'Machine Learning',
            'Data Science',
            'Cybersecurity',
            'Blockchain',

            // Design & Creative
            'UI/UX Design',
            'Figma',
            'Adobe Photoshop',
            'Adobe Illustrator',
            'Video Editing',
            'Motion Graphics',
            '3D Modeling',
            'Photography',
            'Copywriting',
            'Content Writing',

            // Languages
            'English',
            'Spanish',
            'French',
            'German',
            'Arabic',
            'Russian',
            'Chinese (Mandarin)',
            'Japanese',
            'Korean',
            'Italian',
            'Portuguese',
            'Uzbek',

            // Business & Soft Skills
            'Project Management',
            'Product Management',
            'Public Speaking',
            'SEO',
            'Digital Marketing',
            'Excel / Spreadsheets',
            'Accounting',
            'Entrepreneurship',
            'Leadership',

            // Music & Arts
            'Guitar',
            'Piano',
            'Music Production',
            'Singing',
            'Drawing',
            'Painting',

            // Other
            'Mathematics',
            'Physics',
            'Chess',
            'Cooking',
            'Yoga',
        ];

        foreach ($skills as $name) {
            Skill::firstOrCreate(['name' => $name]);
        }
    }
}
