# Cannlaw Implementation Plan - Detailed Technical Specification

## Current System Analysis

### Existing User Roles
- `IsAdmin`: Full system administration access
- `IsStaff`: Staff-level access to appointments and cases
- `IsActive`: User account status

### Required Addition
- `IsLegalProfessional`: Access to Cannlaw legal professional dashboard

---

## Phase 1: Database Schema Extensions

### 1.1 User Entity Extension
```csharp
// Add to User.cs
public bool IsLegalProfessional { get; set; }
```

### 1.2 Site Configuration Entity
```csharp
public class SiteConfiguration
{
    public int Id { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string Tagline { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string BusinessHours { get; set; } = string.Empty;
    public string SocialMediaLinks { get; set; } = string.Empty; // JSON
    public string LogoUrl { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

### 1.3 Team Member Entity
```csharp
public class TeamMember
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
    public string PhotoUrl { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Credentials { get; set; } = string.Empty; // JSON array
    public string PracticeAreas { get; set; } = string.Empty; // JSON array
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

### 1.4 Practice Area Entity
```csharp
public class PracticeArea
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string IconUrl { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

---

## Phase 2: Backend API Development

### 2.1 Site Configuration Controller
```csharp
[ApiController]
[Route("api/v1/site-config")]
public class SiteConfigurationController : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<SiteConfiguration>> GetSiteConfiguration()
    
    [HttpPut]
    [Authorize(Policy = "IsAdmin")]
    public async Task<ActionResult> UpdateSiteConfiguration(SiteConfiguration config)
}
```

### 2.2 Team Management Controller
```csharp
[ApiController]
[Route("api/v1/team")]
public class TeamController : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<TeamMember[]>> GetTeamMembers()
    
    [HttpPost]
    [Authorize(Policy = "IsAdmin")]
    public async Task<ActionResult<TeamMember>> CreateTeamMember(TeamMember member)
    
    [HttpPut("{id}")]
    [Authorize(Policy = "IsAdmin")]
    public async Task<ActionResult> UpdateTeamMember(int id, TeamMember member)
}
```

### 2.3 Legal Professional Authorization Policy
```csharp
// In Program.cs
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("IsLegalProfessional", policy =>
        policy.RequireAssertion(context =>
            context.User.FindFirst("IsLegalProfessional")?.Value == "True"));
});
```

---

## Phase 3: Frontend Public Website

### 3.1 New Page Components Structure
```
web/cannlaw/src/pages/
├── public/
│   ├── HomePage.tsx
│   ├── AboutPage.tsx
│   ├── PracticeAreasPage.tsx
│   ├── AttorneyProfilePage.tsx
│   ├── ContactPage.tsx
│   └── ResourcesPage.tsx
├── dashboard/
│   ├── LegalDashboard.tsx
│   ├── ClientManagement.tsx
│   ├── CaseOverview.tsx
│   └── Analytics.tsx
└── admin/
    ├── SiteConfigPage.tsx
    ├── TeamManagementPage.tsx
    └── ContentManagementPage.tsx
```

### 3.2 Updated App.tsx Structure
```typescript
function App() {
  const { user, isAuthenticated } = useAuth()
  const isLegalProfessional = user?.isLegalProfessional
  const isAdmin = user?.isAdmin

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/practice-areas" element={<PracticeAreasPage />} />
      <Route path="/attorneys/:id" element={<AttorneyProfilePage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/resources" element={<ResourcesPage />} />
      
      {/* Authentication */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Legal Professional Dashboard */}
      {isLegalProfessional && (
        <>
          <Route path="/dashboard" element={<LegalDashboard />} />
          <Route path="/clients" element={<ClientManagement />} />
          <Route path="/cases" element={<CaseOverview />} />
        </>
      )}
      
      {/* Admin Routes */}
      {isAdmin && (
        <>
          <Route path="/admin/site-config" element={<SiteConfigPage />} />
          <Route path="/admin/team" element={<TeamManagementPage />} />
        </>
      )}
    </Routes>
  )
}
```

---

## Phase 4: Specific Implementation Tasks

### 4.1 Backend Tasks (Priority 1)

#### Database Migration
- [ ] Add `IsLegalProfessional` column to Users table
- [ ] Create `SiteConfigurations` table
- [ ] Create `TeamMembers` table  
- [ ] Create `PracticeAreas` table
- [ ] Update DbContext with new entities

#### API Controllers
- [ ] Create `SiteConfigurationController`
- [ ] Create `TeamController`
- [ ] Create `PracticeAreaController`
- [ ] Add legal professional authorization policy
- [ ] Update existing admin endpoints for Cannlaw-specific data

#### Services
- [ ] Create `ISiteConfigurationService`
- [ ] Create `ITeamManagementService`
- [ ] Add caching for site configuration
- [ ] Implement file upload service for logos/photos

### 4.2 Frontend Public Site (Priority 1)

#### Core Components
- [ ] Create `HomePage` with hero section and service overview
- [ ] Create `AboutPage` with firm information
- [ ] Create `PracticeAreasPage` with service listings
- [ ] Create `ContactPage` with contact form and office info
- [ ] Create responsive navigation component
- [ ] Create footer component with social links

#### API Integration
- [ ] Create site configuration API hooks
- [ ] Create team member API hooks
- [ ] Create practice area API hooks
- [ ] Implement contact form submission
- [ ] Add error handling and loading states

#### Styling & UX
- [ ] Implement professional legal services design
- [ ] Ensure mobile responsiveness
- [ ] Add loading skeletons
- [ ] Implement smooth scrolling and animations
- [ ] Add SEO meta tags and structured data

### 4.3 Legal Professional Dashboard (Priority 2)

#### Dashboard Components
- [ ] Create `LegalDashboard` overview page
- [ ] Create `ClientManagement` component
- [ ] Create `CaseOverview` component
- [ ] Create `Analytics` component
- [ ] Add role-based route protection

#### Features
- [ ] Client list with search and filtering
- [ ] Case management integration with existing system
- [ ] Document management interface
- [ ] Appointment scheduling integration
- [ ] Revenue and performance metrics

### 4.4 Admin Configuration (Priority 2)

#### Site Management
- [ ] Create `SiteConfigPage` for editing company info
- [ ] Create `TeamManagementPage` for attorney profiles
- [ ] Create file upload interface for logos/photos
- [ ] Add social media link management
- [ ] Implement content preview functionality

#### User Management
- [ ] Add legal professional role assignment
- [ ] Create user role management interface
- [ ] Add bulk user operations
- [ ] Implement audit logging for admin actions

---

## Phase 5: Integration & Enhancement

### 5.1 Law4Hire Integration
- [ ] Shared authentication between Cannlaw and Law4Hire
- [ ] Case handoff workflow from Law4Hire interviews
- [ ] Unified client experience
- [ ] Shared user profiles and preferences

### 5.2 SEO & Performance
- [ ] Implement Next.js-style SSR for public pages
- [ ] Add Google Analytics and Search Console
- [ ] Optimize images and assets
- [ ] Implement caching strategies
- [ ] Add sitemap generation

### 5.3 Security & Compliance
- [ ] Implement attorney-client privilege protections
- [ ] Add GDPR compliance features
- [ ] Secure document handling with encryption
- [ ] Audit trail for all sensitive operations
- [ ] Regular security assessments

---

## Content Requirements (Awaiting Gemini Analysis)

### Information Needed from https://cannlaw.com
- [ ] Company logo (high resolution)
- [ ] Complete contact information
- [ ] Attorney profiles and photos
- [ ] Practice area descriptions
- [ ] Social media links
- [ ] Client testimonials
- [ ] Office locations and hours
- [ ] Legal disclaimers and policies

### Content Structure
- [ ] Homepage hero messaging
- [ ] About us narrative
- [ ] Individual attorney biographies
- [ ] Practice area detailed descriptions
- [ ] Client success stories
- [ ] Resource library content
- [ ] FAQ sections

---

## Technical Implementation Notes

### Existing Infrastructure Leverage
- Use existing `@l4h/shared-ui` components
- Leverage existing authentication system
- Extend current admin panel structure
- Integrate with existing case management

### New Dependencies
```json
{
  "react-helmet-async": "^1.3.0", // SEO meta tags
  "react-intersection-observer": "^9.5.2", // Scroll animations
  "framer-motion": "^10.16.4", // Smooth animations
  "react-dropzone": "^14.2.3" // File uploads
}
```

### Environment Configuration
```typescript
// Add to environment variables
CANNLAW_SITE_URL=https://cannlaw.com
CANNLAW_ADMIN_EMAIL=dcann@cannlaw.com
UPLOAD_MAX_SIZE=10MB
LOGO_UPLOAD_PATH=/uploads/logos/
TEAM_PHOTOS_PATH=/uploads/team/
```

---

## Success Metrics

### Public Website
- [ ] Page load speed < 3 seconds
- [ ] Mobile PageSpeed score > 90
- [ ] SEO score > 95
- [ ] Accessibility score (WCAG 2.1 AA)
- [ ] Contact form conversion rate tracking

### Legal Professional Dashboard
- [ ] User adoption rate among legal professionals
- [ ] Time savings in case management
- [ ] Client satisfaction scores
- [ ] Revenue tracking accuracy

### Admin Panel
- [ ] Content update frequency
- [ ] User role management efficiency
- [ ] Site configuration change tracking
- [ ] Admin user satisfaction

---

## Deployment Strategy

### Staging Environment
1. Deploy backend API changes
2. Run database migrations
3. Deploy frontend changes
4. Test all user roles and permissions
5. Verify integration with Law4Hire

### Production Deployment
1. Schedule maintenance window
2. Backup existing data
3. Deploy with blue-green strategy
4. Monitor performance and errors
5. Rollback plan if issues arise

### Post-Deployment
1. Monitor user feedback
2. Track performance metrics
3. Gather legal professional input
4. Plan iterative improvements
5. Schedule regular security audits

---

This implementation plan provides a comprehensive roadmap for modernizing the Cannlaw website while maintaining integration with the existing Law4Hire infrastructure. The phased approach ensures minimal disruption while delivering maximum value to both legal professionals and potential clients.