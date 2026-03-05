using Microsoft.EntityFrameworkCore;
using L4H.Infrastructure.Entities;

namespace L4H.Infrastructure.Data;

public static class CaseExtensions
{
    public static IQueryable<Case> FilterActive(this IQueryable<Case> query)
    {
        return query.Where(c => !c.IsDeleted && 
                               c.Status != "Complete" && 
                               c.Status != "Closed (US Government Rejected)");
    }

    public static IQueryable<Case> FilterForClients(this IQueryable<Case> query)
    {
        return query.Where(c => !c.User.IsAdmin && 
                               !c.User.IsStaff && 
                               !c.User.IsLegalProfessional);
    }
}
